import { AppState, rootReducer } from '@app/reducers';
import { History } from 'history';
import { routerMiddleware } from 'react-router-redux';
import { applyMiddleware, createStore, Store } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger } from 'redux-logger';

export function configureStore(history: History, initialState?: AppState): Store<AppState> {
    const logger = createLogger({
        collapsed: true
    });
    let middleware = applyMiddleware(routerMiddleware(history), logger);

    if (process.env.NODE_ENV !== 'production') {
        middleware = composeWithDevTools(middleware);
    }

    const store = createStore(rootReducer as any, initialState as any, middleware) as Store<
        AppState
    >;

    if (module.hot) {
        module.hot.accept('app/reducers', () => {
            const nextReducer = require('app/reducers');
            store.replaceReducer(nextReducer);
        });
    }

    return store;
}
