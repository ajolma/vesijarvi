import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import {createStore, applyMiddleware, combineReducers} from 'redux';
import {Provider} from 'react-redux';
import thunk from 'redux-thunk';
import initReducer from './reducers/initReducer';
import * as serviceWorker from './serviceWorker';
import L from 'leaflet';

export const mapsPlaceHolder = [];
L.Map.addInitHook(function () {
    mapsPlaceHolder.push(this);
});

const rootReducer = combineReducers({
    init: initReducer
});

const store = createStore(rootReducer, applyMiddleware(thunk));

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <Provider store={store}>
      <App />
    </Provider>
);

serviceWorker.unregister();
