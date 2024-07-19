import React, { Component } from 'react';
import './App.css';
import { connect } from 'react-redux';
import { fitBoundsFinally, getLeafs, getPopup } from './actions/initAction';
import LeftPanel from './components/LeftPanel.js';
import MyMap from './components/MyMap.js';

const dev = process.env.NODE_ENV === 'development';
const host = 'biwatech.com';
const path = 'vj3-test'; // vj3
export const server = dev ? `http://localhost:5000/${path}` : `https://${host}/${path}`;

class App extends Component {

    componentDidMount() {
        this.props.dispatch(fitBoundsFinally());
        this.props.dispatch(getLeafs(this.props));
        this.props.dispatch(getPopup());
    }

    render() {
        return (
            <div className="App">
              <LeftPanel/>
              <MyMap/>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
    };
}

export default connect(mapStateToProps)(App);
