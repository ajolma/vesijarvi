import {server} from '../App';

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
export const GET_BATHYMETRY_OK = 'GET_BATHYMETRY_OK';
export const GET_BATHYMETRY_FAIL = 'GET_BATHYMETRY_FAIL';
export const GET_LAKE_AREAS_OK = 'GET_LAKE_AREAS_OK';
export const GET_LAKE_AREAS_FAIL = 'GET_LAKE_AREAS_FAIL';
export const SHOW_LAYER = 'SHOW_LAYER';
export const HIDE_LAYER = 'HIDE_LAYER';
export const HIDE_LEAF = 'HIDE_LEAF';
export const SHOW_LEAF = 'SHOW_LEAF';
export const SHOW_ALL_LAYERS = 'SHOW_ALL_LAYERS';
export const SELECT_FEATURE = 'SELECT_FEATURE';
export const UNSELECT_FEATURE = 'UNSELECT_FEATURE';
export const SELECT_LAKE = 'SELECT_LAKE';
export const UNSELECT_LAKE = 'UNSELECT_LAKE';

export const getPopup = (set) => {
    return dispatch => {
        let url = server + '/popup';
        fetch(url)
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

export const getLayers = (set) => {
    return dispatch => {
        let url = server + '/kohteet/' + set;
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
        let url = server + '/kohteet/6/syvyyskartta=' + lake.properties.syvyyskartta;
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

export const getLakeAreas = () => {
    return dispatch => {
        let url = server + '/kohteet/4/21/jarvialueet';
        fetch(url).then((response) => { // 200-499
            if (response.ok) {
                response.json().then(data => {
                    dispatch(getLakeAreasOk(data));
                }).catch(error => {
                    dispatch(getLakeAreasFail(error));
                });
            } else {
                dispatch(getLakeAreasFail(response.status));
            }
        }).catch((error) => { // 500-599
            dispatch(getLakeAreasFail(error));
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

export const getLakeAreasOk = (data) => {
    return {
        type: GET_LAKE_AREAS_OK,
        data: data
    };
}
export const getLakeAreasFail = (error) => {
    return {
        type: GET_LAKE_AREAS_FAIL,
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

export const showLeaf = (leaf) => {
    return {
        type: SHOW_LEAF,
        leaf: leaf
    };
}

export const hideLeaf = (leaf) => {
    return {
        type: HIDE_LEAF,
        leaf: leaf
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
