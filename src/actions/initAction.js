import {server} from '../App';

export const BUTTONS = 'buttons';
export const BG = 'bg';
export const CATCHMENT_ACTIONS = 'catchment_actions';
export const LAKE_ACTIONS = 'lake_actions';
export const MONITORING = 'monitoring';
export const LAKES = 'lakes';
export const CATCHMENT = 'catchment';
export const ESTATES = 'estates';
export const BATHYMETRIES = 'bathymetries';
export const ACTIONS = 'actions';
export const RIGHTS = 'rights';
export const FUNDERS = 'funders';
export const FEEDBACK = 'feedback';

export const GET_LEAFS_OK = 'GET_LEAFS_OK';
export const GET_LEAFS_FAIL = 'GET_LEAFS_FAIL';
export const GET_POPUP_OK = 'GET_POPUP_OK';
export const GET_POPUP_FAIL = 'GET_POPUP_FAIL';
export const GET_LAYERS_OK = 'GET_LAYERS_OK';
export const GET_LAYERS_FAIL = 'GET_LAYERS_FAIL';
export const GET_FLAGS_OK = 'GET_FLAGS_OK';
export const GET_FLAGS_FAIL = 'GET_FLAGS_FAIL';
export const GET_OIKEUDET_OK = 'GET_OIKEUDET_OK';
export const GET_OIKEUDET_FAIL = 'GET_OIKEUDET_FAIL';
export const GET_BACKGROUND_OK = 'GET_BACKGROUND_OK';
export const GET_BACKGROUND_FAIL = 'GET_BACKGROUND_FAIL';
export const SELECT_BACKGROUND = 'SELECT_BACKGROUND';
export const GET_ESTATES_OK = 'GET_ESTATES_OK';
export const GET_ESTATES_FAIL = 'GET_ESTATES_FAIL';
export const GET_FEATURE_GEOMETRY_OK = 'GET_FEATURE_GEOMETRY_OK';
export const GET_FEATURE_GEOMETRY_FAIL = 'GET_FEATURE_GEOMETRY_FAIL';
export const SHOW_FEATURE = 'SHOW_FEATURE';
export const HIDE_FEATURE = 'HIDE_FEATURE';
export const SHOW_LAYER = 'SHOW_LAYER';
export const SHOW_LAYERS = 'SHOW_LAYERS';
export const HIDE_LAYER = 'HIDE_LAYER';
export const HIDE_LAYERS = 'HIDE_LAYERS';
export const HIDE_LEAF = 'HIDE_LEAF';
export const SHOW_LEAF = 'SHOW_LEAF';
export const SELECT_FEATURE = 'SELECT_FEATURE';
export const UNSELECT_FEATURE = 'UNSELECT_FEATURE';
export const SET_ACTIVE = 'SET_ACTIVE';
export const SET_UNACTIVE = 'SET_UNACTIVE';
export const SET_FOCUSED = 'SET_FOCUSED';
export const FIT_BOUNDS_FINALLY = 'FIT_BOUNDS_FINALLY';

let fitBoundsFinallyCalled = false;
let fitBoundsFinallyPending = 0;

export const getLeafs = (props) => {
    if (fitBoundsFinallyCalled) {
        fitBoundsFinallyPending += 1;
    }
    return dispatch => {
        let obj = {
            method:"GET",
            headers:{
                "Accept-Encoding": "gzip"
            }
        };
        let url = server + '/kohteet';
        fetch(url, obj)
            .then((response) => { // 200-499
                if (response.ok) {
                    response.json()
                        .then(data => {
                            dispatch(getLeafsOk(props, data));
                            return data.length;
                        })
                        .catch(error => {
                            dispatch(getLeafsFail(error));
                        });
                } else {
                    dispatch(getLeafsFail(response.status));
                }
            })
            .catch((error) => { // 500-599
                dispatch(getLeafsFail(error));
            });
    };
};

export const getLayers = (set) => {
    if (fitBoundsFinallyCalled) {
        fitBoundsFinallyPending += 1;
    }
    return dispatch => {
        let obj = {
            method:"GET",
            headers:{
                "Accept-Encoding": "gzip"
            }
        };
        let url = server + '/kohteet/' + set;
        fetch(url, obj)
            .then((response) => { // 200-499
                if (response.ok) {
                    response.json()
                        .then(data => {
                            dispatch(getLayersOk(data));
                            return data.length;
                        })
                        .catch(error => {
                            dispatch(getLayersFail(error));
                        });
                } else {
                    dispatch(getLayersFail(response.status));
                }
            })
            .catch((error) => { // 500-599
                dispatch(getLayersFail(error));
            });
    };
};

export const getEstates = () => {
    if (fitBoundsFinallyCalled) {
        fitBoundsFinallyPending += 1;
    }
    return dispatch => {
        let obj = {
            method:"GET",
            headers:{
                "Accept-Encoding": "gzip"
            }
        };
        let url = server + '/kohteet/' + ESTATES;
        fetch(url, obj).then((response) => { // 200-499
            if (response.ok) {
                response.json().then(data => {
                    dispatch(getEstatesOk(data));
                }).catch(error => {
                    dispatch(getEstatesFail(error));
                });
            } else {
                dispatch(getEstatesFail(response.status));
            }
        }).catch((error) => { // 500-599
            dispatch(getEstatesFail(error));
        });
    };
};

export const getFeatureGeometry = (feature, klass) => {
    if (fitBoundsFinallyCalled) {
        fitBoundsFinallyPending += 1;
    }
    return dispatch => {
        let obj = {
            method:"GET",
            headers:{
                "Accept-Encoding": "gzip"
            }
        };
        let callbacks = [];
        let url = `${server}/kohteet/${klass}/${feature.properties.id}`;
        callbacks.push(fetch(url, obj));
        Promise.all(callbacks).then((responses) => {
            let cb2 = [];
            for (let i = 0; i < responses.length; i++) {
                let response = responses[i];
                if (response.ok) {
                    cb2.push(response.json());
                }
            }
            Promise.all(cb2).then((datas) => {
                dispatch(getFeatureGeometryOk(datas[0], klass));
            });
        }).catch((error) => {
            dispatch(getFeatureGeometryFail(error));
        });
    };
};

export const getPopup = () => {
    return dispatch => {
        let obj = {
            method:"GET",
            headers:{
                "Accept-Encoding": "gzip"
            }
        };
        let url = server + '/popup';
        fetch(url, obj)
            .then((response) => { // 200-499
                if (response.ok) {
                    response.json()
                        .then(data => {
                            dispatch(getPopupOk(data));
                            return data.length;
                        })
                        .catch(error => {
                            dispatch(getPopupFail(error));
                        });
                } else {
                    dispatch(getPopupFail(response.status));
                }
            })
            .catch((error) => { // 500-599
                dispatch(getPopupFail(error));
            });
    };
};

export const getBackground = () => {
    return dispatch => {
        let obj = {
            method:"GET",
            headers:{
                "Accept-Encoding": "gzip"
            }
        };
        let url = server + '/taustakartat';
        fetch(url, obj).then((response) => { // 200-499
            if (response.ok) {
                response.json().then(data => {
                    dispatch(getBackgroundOk(data));
                }).catch(error => {
                    dispatch(getBackgroundFail(error));
                });
            } else {
                dispatch(getBackgroundFail(response.status));
            }
        }).catch((error) => { // 500-599
            dispatch(getBackgroundFail(error));
        });
    };
};

export const getFlags = () => {
    return dispatch => {
        let obj = {
            method:"GET",
            headers:{
                "Accept-Encoding": "gzip"
            }
        };
        let url = server + '/rahoittajat';
        fetch(url, obj).then((response) => { // 200-499
            if (response.ok) {
                response.json().then(data => {
                    dispatch(getFlagsOk(data));
                }).catch(error => {
                    dispatch(getFlagsFail(error));
                });
            } else {
                dispatch(getFlagsFail(response.status));
            }
        }).catch((error) => { // 500-599
            dispatch(getFlagsFail(error));
        });
    };
};

export const getOikeudet = () => {
    return dispatch => {
        let obj = {
            method:"GET",
            headers:{
                "Accept-Encoding": "gzip"
            }
        };
        let url = server + '/oikeudet';
        fetch(url, obj).then((response) => { // 200-499
            if (response.ok) {
                response.json()
                    .then(data => {
                        dispatch(getOikeudetOk(data));
                        return data.length;
                    })
                    .catch(error => {
                        dispatch(getOikeudetFail(error));
                    });
            } else {
                dispatch(getOikeudetFail(response.status));
            }
        }).catch((error) => { // 500-599
            dispatch(getOikeudetFail(error));
        });
    };
};

export const sendFeedback = (data) => {
    return dispatch => {
        let url = server + '/palaute';
        let obj = {
            method: "POST",
            mode: "cors",
            headers:{
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        };
        fetch(url, obj).then((response) => { // 200-499
            if (response.ok) {
                response.json().then(data => {
                    dispatch(sendFeedbackOk(data));
                }).catch(error => {
                    dispatch(sendFeedbackFail(error));
                });
            } else {
                dispatch(sendFeedbackFail(response.status));
            }
        }).catch((error) => { // 500-599
            dispatch(sendFeedbackFail(error));
        });
    };
};

const sendFeedbackOk = (data) => {
    alert("Kiitos palautteestasi!");
    return {
        type: ''
    };
}

const sendFeedbackFail = (error) => {
    alert("Jokin meni vikaan palautetta käsiteltäessä.\n"+
          "Voit lähettää palautetta myös sähköpostilla osoitteeseen info@vesijarvi.fi.");
    return {
        type: ''
    };
}

// Action creators

export const getLeafsOk = (props, data) => {
    if (fitBoundsFinallyCalled) {
        fitBoundsFinallyPending -= 1;
    }
    for (let leaf of data) {
        switch (leaf.klass) {
        case BG:
            props.dispatch(getBackground());
            break;
        case BUTTONS:
        case CATCHMENT_ACTIONS:
        case LAKE_ACTIONS:
        case MONITORING:
        case LAKES: // creates BATHYMETRIES
        case CATCHMENT:
        case ACTIONS:
            props.dispatch(getLayers(leaf.klass));
            break;
        case ESTATES:
            props.dispatch(getEstates());
            break;
        case RIGHTS:
            props.dispatch(getOikeudet());
            break;
        case FUNDERS:
            props.dispatch(getFlags());
            break;
        case FEEDBACK:
        default:
            break;
        }
    }
    props.dispatch(getBackground());
    return {
        type: GET_LEAFS_OK,
        fitBoundsFinallyPending: fitBoundsFinallyPending,
        data: data
    };
}

export const getLeafsFail = (error) => {
    if (fitBoundsFinallyCalled) {
        fitBoundsFinallyPending -= 1;
    }
    return {
        type: GET_LEAFS_FAIL,
        fitBoundsFinallyPending: fitBoundsFinallyPending,
        error: error
    };
}

export const getLayersOk = (data) => {
    if (fitBoundsFinallyCalled) {
        fitBoundsFinallyPending -= 1;
    }
    return {
        type: GET_LAYERS_OK,
        fitBoundsFinallyPending: fitBoundsFinallyPending,
        data: data
    };
}

export const getLayersFail = (error) => {
    if (fitBoundsFinallyCalled) {
        fitBoundsFinallyPending -= 1;
    }
    return {
        type: GET_LAYERS_FAIL,
        fitBoundsFinallyPending: fitBoundsFinallyPending,
        error: error
    };
}

export const getEstatesOk = (data) => {
    if (fitBoundsFinallyCalled) {
        fitBoundsFinallyPending -= 1;
    }
    return {
        type: GET_ESTATES_OK,
        data: data,
        fitBoundsFinallyPending: fitBoundsFinallyPending,
    };
}

export const getEstatesFail = (error) => {
    if (fitBoundsFinallyCalled) {
        fitBoundsFinallyPending -= 1;
    }
    return {
        type: GET_ESTATES_FAIL,
        error: error,
        fitBoundsFinallyPending: fitBoundsFinallyPending,
    };
}

export const getFeatureGeometryOk = (data, klass) => {
    if (fitBoundsFinallyCalled) {
        fitBoundsFinallyPending -= 1;
    }
    return {
        type: GET_FEATURE_GEOMETRY_OK,
        data: data,
        klass: klass,
        fitBoundsFinallyPending: fitBoundsFinallyPending,
    };
}

export const getFeatureGeometryFail = (error) => {
    if (fitBoundsFinallyCalled) {
        fitBoundsFinallyPending -= 1;
    }
    return {
        type: GET_FEATURE_GEOMETRY_FAIL,
        error: error,
        fitBoundsFinallyPending: fitBoundsFinallyPending,
    };
}

export const showFeature = (klass, feature) => {
    return {
        type: SHOW_FEATURE,
        klass: klass,
        feature: feature,
    };
}

export const hideFeature = (klass, feature) => {
    return {
        type: HIDE_FEATURE,
        klass: klass,
        feature: feature,
    };
}

export const getPopupOk = (data) => {
    return {
        type: GET_POPUP_OK,
        data: data
    };
}

export const getPopupFail = (error) => {
    return {
        type: GET_POPUP_FAIL,
        error: error
    };
}

export const getOikeudetOk = (data) => {
    return {
        type: GET_OIKEUDET_OK,
        data: data
    };
}

export const getOikeudetFail = (error) => {
    return {
        type: GET_OIKEUDET_FAIL,
        error: error
    };
}

export const getFlagsOk = (data) => {
    return {
        type: GET_FLAGS_OK,
        data: data
    };
}

export const getFlagsFail = (error) => {
    return {
        type: GET_FLAGS_FAIL,
        error: error
    };
}

export const getBackgroundOk = (data) => {
    return {
        type: GET_BACKGROUND_OK,
        data: data
    };
}

export const getBackgroundFail = (error) => {
    return {
        type: GET_BACKGROUND_FAIL,
        error: error
    };
}

export const selectBackground = (index) => {
    return {
        type: SELECT_BACKGROUND,
        index: index
    };
}

export const showLayer = (layer) => {
    return {
        type: SHOW_LAYER,
        layer: layer
    };
}

export const showLayers = () => {
    return {
        type: SHOW_LAYERS,
    };
}

export const hideLayer = (layer) => {
    return {
        type: HIDE_LAYER,
        layer: layer
    };
}

export const hideLayers = () => {
    return {
        type: HIDE_LAYERS,
    };
}

export const showLeaf = (klass) => {
    return {
        type: SHOW_LEAF,
        klass: klass,
    };
}

export const hideLeaf = (klass) => {
    return {
        type: HIDE_LEAF,
        klass: klass,
    };
}

export const selectFeature = (feature) => {
    return {
        type: SELECT_FEATURE,
        feature: feature
    };
}

export const unselectFeature = () => {
    return {
        type: UNSELECT_FEATURE
    };
}

export const setActive = (klass) => {
    return {
        type: SET_ACTIVE,
        klass: klass,
    };
}

export const setUnActive = (klass) => {
    return {
        type: SET_UNACTIVE,
        klass: klass,
    };
}

export const setFocused = (focused) => {
    return {
        type: SET_FOCUSED,
        focused: focused,
    };
}

export const fitBoundsFinally = () => {
    fitBoundsFinallyCalled = true;
    return {
        type: 'waiting for finally',
    };
}
