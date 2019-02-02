import {server} from '../App';

export const GET_LAYERS_OK = 'GET_LAYERS_OK';
export const GET_LAYERS_FAIL = 'GET_LAYERS_FAIL';
export const GET_FLAGS_OK = 'GET_FLAGS_OK';
export const GET_FLAGS_FAIL = 'GET_FLAGS_FAIL';
export const GET_OIKEUDET_OK = 'GET_OIKEUDET_OK';
export const GET_OIKEUDET_FAIL = 'GET_OIKEUDET_FAIL';
export const GET_LAKES_OK = 'GET_LAKES_OK';
export const GET_LAKES_FAIL = 'GET_LAKES_FAIL';
export const GET_BACKGROUND_OK = 'GET_BACKGROUND_OK';
export const GET_BACKGROUND_FAIL = 'GET_BACKGROUND_FAIL';
export const SELECT_BACKGROUND = 'SELECT_BACKGROUND';
export const GET_BATHYMETRY_OK = 'GET_BATHYMETRY_OK';
export const GET_BATHYMETRY_FAIL = 'GET_BATHYMETRY_FAIL';
export const SHOW_LAYER = 'SHOW_LAYER';
export const HIDE_LAYER = 'HIDE_LAYER';
export const SHOW_ALL_LAYERS = 'SHOW_ALL_LAYERS';
export const SELECT_FEATURE = 'SELECT_FEATURE';
export const UNSELECT_FEATURE = 'UNSELECT_FEATURE';
export const SELECT_LAKE = 'SELECT_LAKE';
export const UNSELECT_LAKE = 'UNSELECT_LAKE';

export const getLayers = () => {
    return dispatch => {
        let url = server + '/kohteet?request=tyypit&type=json';
        fetch(url)
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

export const getOikeudet = () => {
    return dispatch => {
        let url = server + '/oikeudet';
        fetch(url).then((response) => { // 200-499
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

export const getBathymetry = (lake) => {
    return dispatch => {
        let url = server + '/lake/' + lake.syvyyskartta;
        fetch(url).then((response) => { // 200-499
            if (response.ok) {
                response.json().then(data => {
                    dispatch(getBathymetryOk(lake, data));
                }).catch(error => {
                    dispatch(getBathymetryFail(error));
                });
            } else {
                dispatch(getBathymetryFail(response.status));
            }
        }).catch((error) => { // 500-599
            dispatch(getBathymetryFail(error));
        });
    };
};

export const getLakes = () => {
    return dispatch => {
        let url = server + '/lake';
        fetch(url).then((response) => { // 200-499
            if (response.ok) {
                response.json().then(data => {
                    dispatch(getLakesOk(data));
                }).catch(error => {
                    dispatch(getLakesFail(error));
                });
            } else {
                dispatch(getLakesFail(response.status));
            }
        }).catch((error) => { // 500-599
            dispatch(getLakesFail(error));
        });
    };
};

export const getBackground = () => {
    return dispatch => {
        let url = server + '/taustakartat';
        fetch(url).then((response) => { // 200-499
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
        let url = server + '/rahoittajat';
        fetch(url).then((response) => { // 200-499
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

export const getLayersOk = (data) => {
    return {
        type: GET_LAYERS_OK,
        data: data
    };
}

export const getLayersFail = (error) => {
    return {
        type: GET_LAYERS_FAIL,
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

export const getLakesOk = (data) => {
    return {
        type: GET_LAKES_OK,
        data: data
    };
}

export const getLakesFail = (error) => {
    return {
        type: GET_LAKES_FAIL,
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

export const getBathymetryOk = (lake, data) => {
    return {
        type: GET_BATHYMETRY_OK,
        lake: lake,
        data: data
    };
}

export const getBathymetryFail = (error) => {
    return {
        type: GET_BATHYMETRY_FAIL,
        error: error
    };
}

export const showLayer = (index) => {
    return {
        type: SHOW_LAYER,
        index: index
    };
}

export const hideLayer = (index) => {
    return {
        type: HIDE_LAYER,
        index: index
    };
}

export const showAllLayers = () => {
    return {
        type: SHOW_ALL_LAYERS
    };
}

export const selectFeature = (index) => {
    return {
        type: SELECT_FEATURE,
        index: index
    };
}

export const unselectFeature = () => {
    return {
        type: UNSELECT_FEATURE
    };
}

export const selectLake = (index) => {
    return {
        type: SELECT_LAKE,
        index: index
    };
}

export const unselectLake = (index) => {
    return {
        type: UNSELECT_LAKE,
        index: index
    };
}
