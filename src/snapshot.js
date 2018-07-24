import PropTypes from 'prop-types';
import React, { PureComponent, forwardRef } from 'react';
import createActionCreators from 'redux-resource-action-creators';
import { compose } from 'redux';
import { connect } from 'react-redux';
import FeathersContext from './context';

class Snapshot extends PureComponent {
	propTypes = {
		app:          PropTypes.object.isRequired,
		failed:       PropTypes.func.isRequired,
		idle:         PropTypes.func.isRequired,
		list:         PropTypes.string,
		pending:      PropTypes.func.isRequired,
		query:        PropTypes.object,
		requestKey:   PropTypes.string.isRequired,
		resourceType: PropTypes.string.isRequired,
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
		const { app, resourceType, requestKey, list, query, pending, succeeded, failed, idle } = this.props;
		let cancel;

		pending({ resourceType, requestKey });
		Promise.race([
			new Promise((resolve) => { cancel = resolve; }),
			app.service(resourceType).find({ query }),
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
	(Component) => forwardRef((props, ref) => (
		<FeathersContext.Consumer>
			{(app) => <Component {...props} ref={ref} app={app} />}
		</FeathersContext.Consumer>
	)),
	connect(null, Object.entries(createActionCreators('read'))),
)(Snapshot);
