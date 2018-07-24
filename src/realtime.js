import PropTypes from 'prop-types';
import React, { PureComponent, forwardRef } from 'react';
import { _, filterQuery, sorter } from '@feathersjs/commons';
import { actionTypes, getResources } from 'redux-resource';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { createSelector, createStructuredSelector } from 'reselect';
import FeathersContext from './context';

class Realtime extends PureComponent {
	propTypes = {
		app:          PropTypes.object.isRequired,
		list:         PropTypes.string,
		listValues:   PropTypes.array,
		query:        PropTypes.object,
		remove:       PropTypes.func.isRequired,
		resourceType: PropTypes.string.isRequired,
		update:       PropTypes.func.isRequired,
	}
	componentDidMount() {
		const { app, resourceType } = this.props;
		app.service(resourceType).on('created', this.handleChange);
		app.service(resourceType).on('updated', this.handleChange);
		app.service(resourceType).on('patched', this.handleChange);
		app.service(resourceType).on('removed', this.handleRemove);
	}
	componentDidUpdate({ resourceType: prevResourceType }) {
		const { app, resourceType } = this.props;
		if (resourceType !== prevResourceType) {
			app.service(prevResourceType).off('created', this.handleChange);
			app.service(prevResourceType).off('updated', this.handleChange);
			app.service(prevResourceType).off('patched', this.handleChange);
			app.service(prevResourceType).off('removed', this.handleRemove);
			app.service(resourceType).on('created', this.handleChange);
			app.service(resourceType).on('updated', this.handleChange);
			app.service(resourceType).on('patched', this.handleChange);
			app.service(resourceType).on('removed', this.handleRemove);
		}
	}
	componentWillUnmount() {
		const { app, resourceType } = this.props;
		app.service(resourceType).off('created', this.handleChange);
		app.service(resourceType).off('updated', this.handleChange);
		app.service(resourceType).off('patched', this.handleChange);
		app.service(resourceType).off('removed', this.handleRemove);
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
		return update(resourceType, obj, list, matchesQuery ?
			[...listValues, obj]
				.sort(sorter($sort))
				.map(({ id }) => id) :
			listValues
				.filter(({ id }) => obj.id !== id)
				.map(({ id }) => id)
		);
	}
	handleRemove = (obj) => this.props.remove(this.props.resourceType, obj)
	render() {
		return null;
	}
}

export default compose(
	(Component) => forwardRef((props, ref) => (
		<FeathersContext.Consumer>
			{(app) => <Component {...props} ref={ref} app={app} />}
		</FeathersContext.Consumer>
	)),
	connect(
		() => createStructuredSelector({
			listValues: createSelector(
				(state, { resourceType }) => state[resourceType].resources,
				(state, { resourceType, list }) => list && state[resourceType].lists[list],
				(resources, list = []) => getResources({ resources, meta: {} }, list)
			),
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
