```jsx
<Snapshot service="items" list="snapshot" requestKey="getSnapshot" />
```

Query parameters are passed to the feathers service:

```jsx
<Snapshot
	service="items"
	list="snapshot"
	requestKey="getSnapshot"
	query={{ value: true }} />
```

This includes the special parameters:

```jsx
<Snapshot
	service="items"
	list="snapshot"
	requestKey="getSnapshot"
	query={{
		$sort:  { id: -1 },
		$limit: 4,
		$skip:  3,
	}} />
```
