```jsx
<Realtime service="items" list="snapshot" />
```

Because Feathers determines which service events are published on the server, `<Realtime />` filters the service events on the client. Query parameters filter subscribed results:

```jsx
<Realtime
	service="items"
	list="snapshot"
	query={{ value: true }} />
```

The only (currently) supported special query parameter is `$sort`:

```jsx
<Realtime
	service="items"
	list="snapshot"
	query={{
		$sort: { id: -1 },
	}} />
```
