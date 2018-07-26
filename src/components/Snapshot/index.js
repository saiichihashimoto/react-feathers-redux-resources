import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { actionTypes } from 'redux-resource';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import FeathersContext from '../../context';

/**
 * Invokes a feathers service `find` method and dispatches the respective redux-resource actions.
 *
 * @see See [Feathers Adapter `find`](https://docs.feathersjs.com/api/databases/common.html#adapterfindparams) and [Redux Resource Reading Resources](https://redux-resource.js.org/requests/request-actions/reading-resources).
 */
class Snapshot extends PureComponent {
	static propTypes = {
		/**
		 * @see See [Feathers Client](https://docs.feathersjs.com/api/client.html).
		 */
		app:          PropTypes.object.isRequired,
		/**
		 * @see See [Redux Resource Keys](https://redux-resource.js.org/requests/keys).
		 */
		requestKey:   PropTypes.string.isRequired,
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
		 * @see See [Redux Resource Lists](https://redux-resource.js.org/introduction/core-concepts#resource-lists).
		 */
		list:         PropTypes.string,
		/**
		 * @see See [Feathers Querying](https://docs.feathersjs.com/api/databases/querying.html) for parameters.
		 */
		query:        PropTypes.object,
		/** @ignore */
		failed:       PropTypes.func.isRequired,
		/** @ignore */
		idle:         PropTypes.func.isRequired,
		/** @ignore */
		pending:      PropTypes.func.isRequired,
		/** @ignore */
		succeeded:    PropTypes.func.isRequired,
	}
	componentDidMount() {
		this.snapshot = this.getSnapshot();
	}
	componentDidUpdate({ resourceType: prevResourceType, requestKey: prevRequestKey }) {
		const { resourceType, requestKey } = this.props;

		if (resourceType !== prevResourceType || requestKey !== prevRequestKey) {
			this.snapshot.cancel();
			this.snapshot = this.getSnapshot();
		}
	}
	componentWillUnmount() {
		this.snapshot.cancel();
	}
	cancel = () => {}
	getSnapshot = () => {
		const { app, resourceType, requestKey, service, list, query, pending, succeeded, failed, idle } = this.props;
		let cancel;

		pending({ resourceType, requestKey });
		Promise.race([
			new Promise((resolve) => { cancel = resolve; }),
			app.service(service).find({ query }),
		])
			.then(
				(resources) => resources ?
					succeeded({ resourceType, requestKey, list, resources }) :
					idle({ resourceType, requestKey }),
				() => failed({ resourceType, requestKey })
			);

		return { cancel };
	}
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
			resourceType: (state, { resourceType, service }) => resourceType || service,
			service:      (state, { service, resourceType }) => service || resourceType,
		}),
		{
			idle:      (args) => ({ type: actionTypes.READ_RESOURCES_IDLE, ...args }),
			pending:   (args) => ({ type: actionTypes.READ_RESOURCES_PENDING, ...args }),
			succeeded: (args) => ({ type: actionTypes.READ_RESOURCES_SUCCEEDED, ...args }),
			failed:    (args) => ({ type: actionTypes.READ_RESOURCES_FAILED, ...args }),
		}
	),
)(Snapshot);
