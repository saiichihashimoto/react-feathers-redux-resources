import React, { Fragment, PureComponent } from 'react';
import feathers from '@feathersjs/client';
import memory from 'feathers-memory';
import { Provider as ReduxProvider, connect } from 'react-redux';
import { combineReducers, createStore } from 'redux';
import { getResources, resourceReducer } from 'redux-resource';
import FeathersReduxResource from './src/components/FeathersReduxResource';

const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

const margin0 = { margin: 0 };
const bold = { fontWeight: 'bold' };
const boolStyles = {
	[true]:  { color: '#7f9a44' },
	[false]: { color: '#ac4142' },
};

const app = feathers()
	.use('items', memory({
		store: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].reduce((store, id) => ({
			...store,
			[id]: { id, value: id % 2 === 0, numUpdated: 0 },
		}), {}),
	}));

const toggleFive = () => wait(5000)
	.then(() => Promise.all([0, 1, 2, 3, 4, 5].map((id) => wait(id * 275).then(() => app.service('items').patch(id, { numUpdated: app.service('items').store[id].numUpdated + 1, value: !app.service('items').store[id].value })))))
	.then(() => toggleFive());

const toggleRandom = () => wait(1000 + (10000 * Math.random()))
	.then(() => Math.floor(6 * Math.random()))
	.then((id) => app.service('items').patch(id, { numUpdated: app.service('items').store[id].numUpdated + 1, value: !app.service('items').store[id].value }))
	.then(() => toggleRandom());

toggleFive();
toggleRandom();

class Items extends PureComponent {
	render() {
		return (
			<pre style={margin0}>
				getResources(state.items, 'snapshot'){'\n\n'}
				[{'\n'}{this.props.items.map(({ id, numUpdated, value }) => (
					<Fragment key={id}>
						{'  {'} "id": <span style={bold}>{id}</span>, "numUpdated": {numUpdated}, "value": <span style={boolStyles[value]}>{JSON.stringify(value)}</span> {'}'},{'\n'}
					</Fragment>
				))}]
			</pre>
		);
	}
}

const ConnectedItems = connect(({ items }) => ({ items: getResources(items, 'snapshot') }))(Items);

export default class StyleguidistWrapper extends PureComponent {
	state = {
		store: createStore(
			combineReducers({
				items: resourceReducer('items'),
			}),
			window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
		),
	};
	render() {
		const { children } = this.props;
		const { store } = this.state;

		return (
			<ReduxProvider store={store}>
				<FeathersReduxResource app={app}>
					{children}
					<ConnectedItems />
				</FeathersReduxResource>
			</ReduxProvider>
		);
	}
}
