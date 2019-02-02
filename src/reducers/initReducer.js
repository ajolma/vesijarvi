import {getMapZoom} from '../components/MyMap';
import L from 'leaflet';

import {
    GET_LAYERS_OK,
    GET_LAYERS_FAIL,
    GET_OIKEUDET_OK,
    GET_OIKEUDET_FAIL,
    GET_LAKES_OK,
    GET_LAKES_FAIL,
    GET_BACKGROUND_OK,
    GET_BACKGROUND_FAIL,
    SELECT_BACKGROUND,
    GET_FLAGS_OK,
    GET_FLAGS_FAIL,
    GET_BATHYMETRY_OK,
    GET_BATHYMETRY_FAIL,
    SHOW_LAYER,
    HIDE_LAYER,
    SHOW_ALL_LAYERS,
    SELECT_FEATURE,
    UNSELECT_FEATURE,
    SELECT_LAKE,
    UNSELECT_LAKE
} from '../actions/initAction';

const initialState = {
    latlng: [61.05, 25.55],
    zoom: 11,
    layers: [],
    features: [],
    selected_feature: null,
    styles: [],
    lakes: [],
    backgrounds: [],
    flags: [],
    bathymetries: [],
    oikeudet: {},
    error: undefined
}

function makeMarker(feature, latlng) {
    let props = feature.properties;
    let myIcon;
    if (props.legend === 'nimi') {
        myIcon = L.divIcon({
            className: 'my-div-icon',
            html: props.nimi
        });
    } else {
        myIcon = L.icon({
            iconUrl: '/media/' + props.legend,
            iconSize: [props.graphic_width, props.graphic_height]
        });
    }
    return L.marker(latlng, {icon: myIcon});
}

const initReducer = (state=initialState, action) => {
    switch (action.type) {
    case GET_LAYERS_OK:
        let layers = [];
        action.data.sort(function(a, b) {
            return a.name.localeCompare(b.name, 'fi');
        });
        let features = [];
        let styles = [];
        for (let i = 0; i < action.data.length; i++) {
            let layer = action.data[i];
            layers.push(layer);
            styles.push(makeMarker);
            let fs = layer.features;
            if (fs && fs.features && layer.leaf < 5) {
                fs = fs.features;
                for (let j = 0; j < fs.length; j++) {
                    let coords = fs[j].geometry.coordinates;
                    let p = fs[j].properties;
                    p.legend = layer.legend;
                    p.graphic_width = layer.graphic_width;
                    p.graphic_height = layer.graphic_height;
                    features.push({
                        properties: p,
                        latlng: [coords[1], coords[0]]
                    });
                }
            }
        }
        features.sort(function(a, b) {
            return a.properties.nimi.localeCompare(b.properties.nimi, 'fi');
        });
        return {
            ...state,
            layers: layers,
            features: features,
            styles: styles,
            error: ''
        };
    case GET_LAYERS_FAIL:
        return {
            ...state,
            error: action.error
        };
    case GET_LAKES_OK:
        let lakes = action.data.sort(function(a, b) {
            return a.nimi.localeCompare(b.nimi, 'fi');
        });
        let bathymetries = [];
        for (let i = 0; i < lakes.length; i++) {
            lakes[i].show_bathymetry = false;
            bathymetries.push(null);
        }
        return {
            ...state,
            lakes: lakes,
            bathymetries: bathymetries,
            error: ''
        };
    case GET_LAKES_FAIL:
        return {
            ...state,
            error: action.error
        };
    case GET_BACKGROUND_OK:
        let backgrounds = [];
        let default_set = false;
        for (let i = 0; i < action.data.length; i++) {
            let background = action.data[i];
            if (!default_set && background.oletus === 1) {
                background.visible = true;
                default_set = true;
            } else {
                background.visible = false;
            }
            backgrounds.push(background);
        }
        if (!default_set) {
            backgrounds[0].visible = true;
        }
        return {
            ...state,
            backgrounds: backgrounds,
            error: ''
        };
    case GET_BACKGROUND_FAIL:
        return {
            ...state,
            error: action.error
        };
    case SELECT_BACKGROUND:
        backgrounds = [];
        for (let i = 0; i < state.backgrounds.length; i++) {
            let background = state.backgrounds[i];
            background.visible = false;
            backgrounds.push(background);
        }
        default_set = false;
        for (let i = 0; i < state.backgrounds.length; i++) {
            let background = state.backgrounds[i];
            if (action.index === i) {
                background.visible = true;
                default_set = true;
                break;
            }
        }
        if (!default_set) {
            backgrounds[0].visible = true;
        }
        return {
            ...state,
            backgrounds: backgrounds,
            error: ''
        };
    case GET_OIKEUDET_OK:
        return {
            ...state,
            oikeudet: action.data
        };
    case GET_OIKEUDET_FAIL:
        return {
            ...state,
            error: action.error
        };
    case GET_FLAGS_OK:
        return {
            ...state,
            flags: action.data,
            error: ''
        };
    case GET_FLAGS_FAIL:
        return {
            ...state,
            error: action.error
        };
    case GET_BATHYMETRY_OK:
        bathymetries = [];
        for (let i = 0; i < state.bathymetries.length; i++) {
            if (state.lakes[i].id === action.lake.id) {
                bathymetries.push(action.data);
            } else {
                bathymetries.push(state.bathymetries[i]);
            }
        }
        return {
            ...state,
            bathymetries: bathymetries,
            error: ''
        };
    case GET_BATHYMETRY_FAIL:
        return {
            ...state,
            error: action.error
        };
    case SHOW_LAYER:
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            let layer = state.layers[i];
            if (i === action.index) {
                layer.visible = true;
            }
            layers.push(layer);
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case HIDE_LAYER:
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            let layer = state.layers[i];
            if (i === action.index) {
                layer.visible = false;
            }
            layers.push(layer);
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case SHOW_ALL_LAYERS:
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            let layer = state.layers[i];
            layer.visible = true;
            layers.push(layer);
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case SELECT_FEATURE:
        let newState = {
            ...state,
            latlng: state.features[action.index].latlng,
            selected_feature: state.features[action.index],
            error: ''
        };
        let zoom = getMapZoom();
        if (zoom) {
            newState.zoom = zoom;
        }
        return newState;
    case UNSELECT_FEATURE:
        return {
            ...state,
            selected_feature: null,
            error: ''
        };
    case SELECT_LAKE:
        lakes = [];
        for (let i = 0; i < state.lakes.length; i++) {
            lakes.push(state.lakes[i]);
            if (i === action.index) {
                lakes[i].show_bathymetry = true;
            }
        }
        newState = {
            ...state,
            latlng: state.lakes[action.index].latlng,
            lakes: lakes,
            error: ''
        };
        zoom = getMapZoom();
        if (zoom) {
            newState.zoom = zoom;
        }
        return newState;
    case UNSELECT_LAKE:
        lakes = [];
        for (let i = 0; i < state.lakes.length; i++) {
            lakes.push(state.lakes[i]);
            if (i === action.index) {
                lakes[i].show_bathymetry = false;
            }
        }
        return {
            ...state,
            lakes: lakes,
            error: ''
        };
    default:
        return state;
    }
}

export default initReducer;
