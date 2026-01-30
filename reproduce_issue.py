import os
import sys
import time
import threading
import logging

# Configure logging to stdout
logging.basicConfig(level=logging.INFO)

# Import SITAProcessor
try:
    from processor import SITAProcessor
except ImportError:
    # Add current directory to path if needed
    sys.path.append(os.getcwd())
    from processor import SITAProcessor

processor = SITAProcessor()

def update_callback(counters):
    print(f"Callback: {counters}")

def background_process(video_input, output_csv, output_video):
    print("Starting background process...")
    try:
        counters = processor.process_video(video_input, output_csv, output_video, update_callback=update_callback)
        print(f"Processing Complete! Counters: {counters}")
    except Exception as e:
        print(f"Processing Failed: {e}")
        import traceback
        traceback.print_exc()

def main():
    print("Initializing Processor (Main Thread)...")
    
    video_input = "verify_output.mp4"
    if not os.path.exists(video_input):
        print(f"Error: {video_input} not found.")
        # Try finding any mp4
        for f in os.listdir("."):
            if f.endswith(".mp4"):
                video_input = f
                break
        else:
            print("No MP4 found to test.")
            return

    print(f"Testing with video: {video_input} in a SEPARATE THREAD")
    
    output_csv = "repro_output.csv"
    output_video = "repro_output.mp4"
    
    start_time = time.time()
    
    # Run in thread
    t = threading.Thread(target=background_process, args=(video_input, output_csv, output_video))
    t.start()
    
    # Wait for it
    while t.is_alive():
        print("Main thread waiting...")
        time.sleep(2)
        if time.time() - start_time > 60:
            print("TIMEOUT! Thread is likely stuck.")
            os._exit(1) # Hard exit
    
    t.join()
    print(f"Time taken: {time.time() - start_time:.2f}s")

if __name__ == "__main__":
    main()
