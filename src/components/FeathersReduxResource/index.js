import React, { PureComponent } from 'react';
import FeathersContext from '../../context';

/**
 * Passes all props to any nested `<Snapshot />` and `<Realtime />`.
 */
export default class FeathersReduxResource extends PureComponent {
	render() {
		const { children, ...props } = this.props;

		return (
			<FeathersContext.Consumer>
				{(providedProps) => (
					<FeathersContext.Provider value={{ ...providedProps, ...props }}>
						{children}
					</FeathersContext.Provider>
				)}
			</FeathersContext.Consumer>
		);
	}
}
