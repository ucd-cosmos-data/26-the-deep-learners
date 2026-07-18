---
Title: "Mini Project 3"
--- 
## Map
<div id="fig-cluster-plot" style="width: 100%; max-width: 1100px; margin: 0 auto;">
{{< include-html "/HTMLs/cluster_plot.html" "Real-Estate Market Regions" >}}
</div>\


### Code:
```python
import pandas as pd
from sklearn.datasets import fetch_california_housing
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

data = fetch_california_housing(as_frame=True)
df = data.frame

display(df)
print(data.DESCR)
```

#### Standardizing the Data
```python
cX = df.loc[:, ['Longitude', 'Latitude', 'MedHouseVal']]
tf = StandardScaler()
X_scaled = tf.fit_transform(X)
df[['Scaled_Longitude', 'Scaled_Latitude']] = X_scaled[:, :2]

inertia = []
k_range = range(1, 10)

for k in k_range:
    kmeans = KMeans(n_clusters=k, init='k-means++', random_state=0, n_init='auto')
    kmeans.fit(X_scaled)
    inertia.append(kmeans.inertia_)

# plot elbow curve
plt.plot(k_range, inertia, marker='o')
plt.title('The Elbow Method')
plt.xlabel('Number of Clusters (K)')
plt.ylabel('Inertia')
plt.show()
```

#### K Selection
```python
k = 4
kmeans = KMeans(n_clusters=k, init='k-means++', random_state=0, n_init='auto')
kmeans.fit(X_scaled)
df['Cluster'] = kmeans.labels_

plt.figure(figsize=(15, 9)) 
plt.scatter(df['Scaled_Longitude'], df['Scaled_Latitude'], c=df['Cluster'])

plt.show()
```

#### Each Region's Mean Price
```python
for i in range(1,5):
    print(f"Mean Price of Cluster {i}: {df[df['Cluster'] == i-1]['MedHouseVal'].mean()}")
```

