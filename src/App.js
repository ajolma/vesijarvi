import React, { Component } from 'react';
import './App.css';
import { connect } from 'react-redux';
import { fitBoundsFinally, getLeafs, getPopup } from './actions/initAction';
import LeftPanel from './components/LeftPanel.js';
import MyMap from './components/MyMap.js';

//export const server = 'https://biwatech.com/vj2';
export const server = 'http://localhost:5000/vj2-test';
//export const server = 'https://biwatech.com/vj2-test';

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
