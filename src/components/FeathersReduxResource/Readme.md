```jsx
<FeathersReduxResource service="items" list="snapshot">
	<Realtime />
	<Snapshot requestKey="getSnapshot" />
</FeathersReduxResource>
```

```jsx
<FeathersReduxResource
	service="items"
	list="snapshot"
	query={{
		$sort: { id: -1 },
		value: true,
	}}>
	<Realtime />
	<Snapshot requestKey="getSnapshot" />
</FeathersReduxResource>
```
