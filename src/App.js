import React, { Component } from 'react';
import './App.css';
import {connect} from 'react-redux';
import {getPopup, getLayers, getOikeudet, getBackground, getFlags} from './actions/initAction';
import LeftPanel from './components/LeftPanel.js';
import MyMap from './components/MyMap.js';

export const server = 'https://biwatech.com/vj2';
//export const server = 'http://192.168.11.23:5000/vj2';

class App extends Component {

    componentDidMount() {
        this.props.dispatch(getPopup());
        this.props.dispatch(getBackground());
        this.props.dispatch(getLayers(1));
        this.props.dispatch(getLayers(2));
        this.props.dispatch(getLayers(3));
        this.props.dispatch(getLayers(4));
        this.props.dispatch(getLayers(5));
        this.props.dispatch(getOikeudet());
        this.props.dispatch(getFlags());
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
