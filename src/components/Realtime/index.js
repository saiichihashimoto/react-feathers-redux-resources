import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { _, filterQuery, sorter } from '@feathersjs/commons';
import { actionTypes, getResources } from 'redux-resource';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { createSelector, createStructuredSelector } from 'reselect';
import FeathersContext from '../../context';

/**
 * Subscribes to feathers service events and dispatches the respective redux-resource actions.
 *
 * @see See [Feathers Service Events](https://docs.feathersjs.com/api/events.html#service-events) and [Redux Resource Modifying Resources](https://redux-resource.js.org/resources/modifying-resources).
 */
class Realtime extends PureComponent {
	static propTypes = {
		/**
		 * @see See [Feathers Client](https://docs.feathersjs.com/api/client.html).
		 */
		app:          PropTypes.object.isRequired,
		/**
		 * Defaults to `service`.
		 *
		 * @see See [Redux Resource Resources](https://redux-resource.js.org/introduction/core-concepts#resources).
		 */
		resourceType: PropTypes.string.isRequired,
		/**
		 * Defaults to `resourceType`.
		 *
		 * @see See [Feathers Service Path](https://docs.feathersjs.com/api/application.html#servicepath).
		 */
		service:      PropTypes.string.isRequired,
		/**
		 * @see See [Feathers Service Events](https://docs.feathersjs.com/api/events.html#service-events).
		 */
		events:       PropTypes.arrayOf(PropTypes.string).isRequired,
		/**
		 * A redux-resource list to modify.
		 *
		 * @see See [Redux Resource Lists](https://redux-resource.js.org/introduction/core-concepts#resource-lists).
		 */
		list:         PropTypes.string,
		/**
		 * A feathers query criteria for maintaining the list. Ignored if list is omitted.
		 *
		 * @see See [Feathers Querying](https://docs.feathersjs.com/api/databases/querying.html) for parameters.
		 */
		query:        PropTypes.object,
		/** @ignore */
		listValues:   PropTypes.array,
		/** @ignore */
		remove:       PropTypes.func.isRequired,
		/** @ignore */
		update:       PropTypes.func.isRequired,
	}
	static defaultProps = {
		events: ['created', 'updated', 'patched', 'removed'],
	}
	componentDidMount() {
		const { app, service, events } = this.props;

		events.forEach((event) => app.service(service).on(event, (event === 'removed') ? this.handleRemove : this.handleChange));
	}
	componentDidUpdate({ service: prevService, events: prevEvents }) {
		const { app, service, events } = this.props;

		if (service !== prevService || events !== prevEvents) {
			prevEvents.forEach((event) => app.service(prevService).removeListener(event, (event === 'removed') ? this.handleRemove : this.handleChange));
			events.forEach((event) => app.service(service).on(event, (event === 'removed') ? this.handleRemove : this.handleChange));
		}
	}
	componentWillUnmount() {
		const { app, service, events } = this.props;

		events.forEach((event) => app.service(service).removeListener(event, (event === 'removed') ? this.handleRemove : this.handleChange));
	}
	handleChange = (obj) => {
		const { resourceType, update, list, listValues, query: unfilteredQuery = {} } = this.props;
		if (!list) {
			return update(resourceType, obj);
		}
		const { query, filters: { $sort } } = filterQuery(unfilteredQuery);
		const matchesQuery = _.isMatch(obj, query);
		if (matchesQuery === listValues.some(({ id }) => obj.id === id)) {
			return update(resourceType, obj);
		}

		const updatedList = matchesQuery ? [...listValues, obj] : listValues.filter(({ id }) => obj.id !== id);

		if (matchesQuery && $sort) {
			updatedList.sort(sorter($sort));
		}

		return update(resourceType, obj, list, updatedList.map(({ id }) => id));
	}
	handleRemove = (obj) => this.props.remove(this.props.resourceType, obj)
	render() {
		return null;
	}
}

export default compose(
	(Component) => (props) => (
		<FeathersContext.Consumer>
			{(providedProps) => <Component {...providedProps} {...props} />}
		</FeathersContext.Consumer>
	),
	connect(
		() => createStructuredSelector({
			listValues: createSelector(
				(state, { resourceType, service }) => state[resourceType || service].resources,
				(state, { resourceType, service, list }) => list && state[resourceType || service].lists[list],
				(resources, list = []) => getResources({ resources, meta: {} }, list)
			),
			resourceType: (state, { resourceType, service }) => resourceType || service,
			service:      (state, { service, resourceType }) => service || resourceType,
		}),
		{
			update: (resourceType, obj, listName, list) => ({
				type:      actionTypes.UPDATE_RESOURCES,
				resources: obj && {
					[resourceType]: {
						[obj.id]: obj,
					},
				},
				lists: listName && list && {
					[resourceType]: {
						[listName]: list,
					},
				},
			}),
			remove: (resourceType, { id }) => ({
				type:      actionTypes.DELETE_RESOURCES,
				resources: { [resourceType]: [id] },
			}),
		}
	),
)(Realtime);
