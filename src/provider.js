import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import FeathersContext from './context';

export default class Provider extends PureComponent {
	propTypes = {
		children: PropTypes.node,
		client:   PropTypes.object.isRequired,
	}
	render() {
		const { client, children } = this.props;

		return (
			<FeathersContext.Provider value={client}>
				{children}
			</FeathersContext.Provider>
		);
	}
}
