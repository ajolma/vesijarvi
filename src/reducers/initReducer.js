import {getMapZoom} from '../components/MyMap';
import L from 'leaflet';

import {
    GET_POPUP_OK,
    GET_POPUP_FAIL,
    GET_LAYERS_OK,
    GET_LAYERS_FAIL,
    GET_OIKEUDET_OK,
    GET_OIKEUDET_FAIL,
    GET_BACKGROUND_OK,
    GET_BACKGROUND_FAIL,
    SELECT_BACKGROUND,
    GET_FLAGS_OK,
    GET_FLAGS_FAIL,
    GET_BATHYMETRY_OK,
    GET_BATHYMETRY_FAIL,
    GET_LAKE_AREAS_OK,
    GET_LAKE_AREAS_FAIL,
    SHOW_LAYER,
    HIDE_LAYER,
    SHOW_LEAF,
    HIDE_LEAF,
    SHOW_ALL_LAYERS,
    SELECT_FEATURE,
    UNSELECT_FEATURE,
    SELECT_LAKE,
    UNSELECT_LAKE
} from '../actions/initAction';

const initialState = {
    latlng: [61.05, 25.55],
    zoom: 11,
    popup: [],
    layers: [],
    features: [],
    selected_feature: null,
    lakes: null, // pointer to lake layer
    backgrounds: [],
    flags: [],
    oikeudet: {},
    error: undefined
}

function makeMarker(feature, latlng) {
    let props = feature.properties;
    let myIcon;
    if (props.label) {
        myIcon = L.divIcon({
            className: 'my-div-icon',
            html: props[props.label]
        });
    } else {
        myIcon = L.icon({
            iconUrl: 'media/' + props.legend,
            iconSize: [props.graphic_width, props.graphic_height]
        });
    }
    return L.marker(latlng, {icon: myIcon});
}

const initReducer = (state=initialState, action) => {
    console.log(action);
    switch (action.type) {
    case GET_POPUP_OK:
        return {
            ...state,
            popup: action.data,
            error: ''
        };
    case GET_POPUP_FAIL:
        return {
            ...state,
            error: action.error
        };
    case GET_LAYERS_OK:
        let lakes = state.lakes;
        let layers = [];
        let features = [];
        for (let i = 0; i < state.layers.length; i++) {
            layers.push(state.layers[i]);
        }
        for (let i = 0; i < state.features.length; i++) {
            features.push(state.features[i]);
        }
        for (let i = 0; i < action.data.length; i++) {
            let layer = action.data[i];
            if (!lakes && layer.name === 'Järvet') {
                lakes = layer;
            }
            layer.style = makeMarker;
            layers.push(layer);
            let fs = layer.features;
            if (fs && fs.features && layer.leaf < 5) {
                fs = fs.features;
                for (let j = 0; j < fs.length; j++) {
                    let coords = fs[j].geometry.coordinates;
                    let p = fs[j].properties;
                    p.legend = layer.legend;
                    p.label = layer.label;
                    p.graphic_width = layer.graphic_width;
                    p.graphic_height = layer.graphic_height;
                    p.kohdetyyppi = layer.name;
                    features.push({
                        properties: p,
                        latlng: [coords[1], coords[0]]
                    });
                }
            }
        }
        layers.sort(function(a, b) {
            if (a.taso && b.taso) {
                return a.taso - b.taso;
            }
            let n = a.name;
            if (typeof n === 'undefined') {
                n = '';
            }
            return n.localeCompare(b.name, 'fi');
        });
        features.sort(function(a, b) {
            let n = a.properties.nimi;
            if (typeof n === 'undefined') {
                n = '';
            }
            return n.localeCompare(b.properties.nimi, 'fi');
        });
        return {
            ...state,
            layers: layers,
            features: features,
            lakes: lakes,
            error: ''
        };
    case GET_LAYERS_FAIL:
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
        lakes = null;
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            layers.push(state.layers[i]);
            if (state.layers[i].name === 'Järvet') {
                lakes = state.layers[i];
                for (let i = 0; i < lakes.features.features.length; i++) {
                    let lake = lakes.features.features[i];
                    if (lake.id === action.lake.id) {
                        lake.bathymetry = action.data;
                        break;
                    }
                }
            }
        }
        return {
            ...state,
            layers: layers,
            lakes: lakes,
            error: ''
        };
    case GET_BATHYMETRY_FAIL:
        return {
            ...state,
            error: action.error
        };
    case GET_LAKE_AREAS_OK:
        lakes = null;
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            layers.push(state.layers[i]);
            if (state.layers[i].name === 'Järvet') {
                lakes = state.layers[i];
                for (let i = 0; i < lakes.features.features.length; i++) {
                    let lake = lakes.features.features[i];
                    if (action.data[lake.id]) {
                        lake.area = action.data[lake.id];
                    }
                }
            }
        }
        return {
            ...state,
            layers: layers,
            lakes: lakes,
            error: ''
        };
    case GET_LAKE_AREAS_FAIL:
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
    case SHOW_LEAF:
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            let layer = state.layers[i];
            if (action.leaf === 4 && layer.leaf >= 4) {
                layer.visible = true;
            } else if (layer.leaf === action.leaf) {
                layer.visible = true;
            }
            layers.push(layer);
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case HIDE_LEAF:
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            let layer = state.layers[i];
            if (action.leaf === 4 && layer.leaf >= 4) {
                layer.visible = false;
            } else if (layer.leaf === action.leaf) {
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
        let latlng = state.latlng;
        lakes = null;
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            layers.push(state.layers[i]);
            if (state.layers[i].name === 'Järvet') {
                lakes = state.layers[i];
                let lake = lakes.features.features[action.index];
                lake.show_bathymetry = true;
                latlng = [lake.geometry.coordinates[1], lake.geometry.coordinates[0]];
            }
        }
        newState = {
            ...state,
            latlng: latlng,
            layers: layers,
            lakes: lakes,
            error: ''
        };
        zoom = getMapZoom();
        if (zoom) {
            newState.zoom = zoom;
        }
        return newState;
    case UNSELECT_LAKE:
        lakes = null;
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            layers.push(state.layers[i]);
            if (state.layers[i].name === 'Järvet') {
                lakes = state.layers[i];
                let lake = lakes.features.features[action.index];
                lake.show_bathymetry = false;
            }
        }
        return {
            ...state,
            layers: layers,
            lakes: lakes,
            error: ''
        };
    default:
        return state;
    }
}

export default initReducer;
