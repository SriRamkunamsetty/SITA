import csv
import matplotlib.pyplot as plt

# -----------------------------
# Read vehicle count CSV
# -----------------------------
vehicle_types = []
vehicle_counts = []

with open("vehicle_count.csv", "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        vehicle_types.append(row["vehicle_type"])
        vehicle_counts.append(int(row["count"]))

# -----------------------------
# Read color count CSV
# -----------------------------
colors = []
color_counts = []

with open("color_count.csv", "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        colors.append(row["color"])
        color_counts.append(int(row["count"]))

# -----------------------------
# Plot vehicle count graph
# -----------------------------
plt.figure()
plt.bar(vehicle_types, vehicle_counts)
plt.title("Vehicle-wise Traffic Count")
plt.xlabel("Vehicle Type")
plt.ylabel("Count")
plt.show()

# -----------------------------
# Plot color count graph
# -----------------------------
plt.figure()
plt.bar(colors, color_counts)
plt.title("Color-wise Vehicle Count")
plt.xlabel("Vehicle Color")
plt.ylabel("Count")
plt.show()
