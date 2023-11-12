//import {getMapZoom} from '../components/MyMap';
import L from 'leaflet';

import {
    BUTTONS,
    CATCHMENT_ACTIONS, LAKE_ACTIONS, MONITORING, BATHYMETRY,
    GET_LEAFS_OK, GET_LEAFS_FAIL,
    GET_POPUP_OK, GET_POPUP_FAIL,
    GET_LAYERS_OK, GET_LAYERS_FAIL,
    GET_OIKEUDET_OK, GET_OIKEUDET_FAIL,
    GET_BACKGROUND_OK, GET_BACKGROUND_FAIL,
    GET_FLAGS_OK, GET_FLAGS_FAIL,
    GET_BATHYMETRY_OK, GET_BATHYMETRY_FAIL,
    GET_LAKE_AREAS_OK, GET_LAKE_AREAS_FAIL,
    SELECT_BACKGROUND,
    SHOW_LAYER, SHOW_LAYERS, HIDE_LAYER, HIDE_LAYERS,
    SHOW_LEAF, HIDE_LEAF,
    SELECT_FEATURE,
    UNSELECT_FEATURE,
    SELECT_LAKE,
    UNSELECT_LAKE,
    SET_ZOOM,
    SET_ACTIVE,
    SET_UNACTIVE,
    SET_FOCUSED
} from '../actions/initAction';

export const LAKES = 'lakes';

export const getBounds = (coordinates, bounds) => {
    let set_minmax_from = (x, y) => {
        if (Array.isArray(x)) {
            console.log('error');
            x = 1/0;
            return;
        }
        if (x < y) {
            let a = y;
            y = x;
            x = a;
        }
        if (!bounds) {
            bounds = [[x, y], [x, y]];
        } else {
            bounds[0][0] = x < bounds[0][0] ? x : bounds[0][0];
            bounds[0][1] = y < bounds[0][1] ? y : bounds[0][1];
            bounds[1][0] = x > bounds[1][0] ? x : bounds[1][0];
            bounds[1][1] = y > bounds[1][1] ? y : bounds[1][1];
        }
    };
    //console.log(coordinates);
    if (Array.isArray(coordinates[0])) {
        for (let i = 0; i < coordinates.length; i++) {
            let c2 = coordinates[i];
            if (Array.isArray(c2[0])) {
                for (let j = 0; j < c2.length; j++) {
                    let c3 = c2[j];
                    if (Array.isArray(c3[0])) {
                        for (let k = 0; k < c3.length; k++) {
                            let c4 = c3[k];
                            if (Array.isArray(c4[0])) {
                                for (let l = 0; l < c4.length; l++) {
                                    let c5 = c4[k];
                                    set_minmax_from(c5[0], c5[1]);
                                }
                            } else {
                                set_minmax_from(c4[0], c4[1]);
                            }
                        }
                    } else {
                        set_minmax_from(c3[0], c3[1]);
                    }
                }
            } else {
                set_minmax_from(c2[0], c2[1]);
            }
        }
    } else {
        set_minmax_from(coordinates[0], coordinates[1]);
    }
    if (bounds[0][0] < bounds[0][1]) {
        let a = bounds[0][0];
        bounds[0][0] = bounds[0][1];
        bounds[0][1] = a;
        a = bounds[1][0];
        bounds[1][0] = bounds[1][1];
        bounds[1][1] = a;
    }
    return bounds;
}

const initialState = {
    latlng: [61.05, 25.55],
    zoom: 11,
    leafs: null,
    popup: [],
    layers: [],
    features: [],
    selected_feature: null,
    lakes: null, // pointer to lakes layer
    backgrounds: [],
    flags: [],
    oikeudet: {},
    focused: true,
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
            iconUrl: process.env.PUBLIC_URL + '/media/' + props.legend,
            iconSize: [props.graphic_width, props.graphic_height]
        });
    }
    return L.marker(latlng, {
        icon: myIcon,
        autoPan: true
    });
}

const initReducer = (state=initialState, action) => {
    //console.log(action);
    switch (action.type) {
    case GET_LEAFS_OK:
        return {
            ...state,
            leafs: action.data,
            error: ''
        };
    case GET_LEAFS_FAIL:
        return {
            ...state,
            error: action.error
        };
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
        let data = action.data;
        data.sort(function(a, b) {
            if (a.taso && b.taso) {
                return a.taso - b.taso;
            }
            let n = a.name;
            if (typeof n === 'undefined') {
                n = '';
            }
            return n.localeCompare(b.name, 'fi');
        });
        for (let i = 0; i < data.length; i++) {
            let layer = action.data[i];
            if (!lakes && layer.class === LAKES) {
                lakes = layer;
            }
            layer.style = makeMarker;
            layers.push(layer);
            let fs = layer.features;
            if (fs && fs.features && layer.geometry_type === 'Point') {
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
            lakes: lakes,
            features: features,
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
            if (state.layers[i].class === LAKES) {
                lakes = state.layers[i];
                //console.log('lakes',lakes);
                for (let i = 0; i < lakes.features.features.length; i++) {
                    let lake = lakes.features.features[i];
                    if (lake.id === action.lake.id) {
                        lake.bathymetry = action.data;
                        let bounds = getBounds(lake.bathymetry);
                        lake.bathymetry_bounds = bounds;
                        //console.log('lake w bat',lake);
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
            if (state.layers[i].class === LAKES) {
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
            //console.log(i,layer.klass,layer.name);
            if (String(i) === action.index) {
                layer.visible = true;
            }
            layers.push(layer);
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case SHOW_LAYERS:
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            let layer = state.layers[i];
            switch (layer.klass) {
            case BUTTONS:
            case CATCHMENT_ACTIONS:
            case LAKE_ACTIONS:
            case MONITORING:
            case LAKES:
                layer.visible = true;
                break;
            default:
                break;
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
            if (String(i) === action.index) {
                layer.visible = false;
            }
            layers.push(layer);
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case HIDE_LAYERS:
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            let layer = state.layers[i];
            layers.push(layer);
            if (layer.class === LAKES) {
                for (let j = 0; j < layer.features.features.length; j++) {
                    let lake = layer.features.features[j];
                    lake.show_bathymetry = false;
                }
            }
            layer.visible = false;
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case SHOW_LEAF:
        if (action.klass === BATHYMETRY) {
            layers = [];
            for (let i = 0; i < state.layers.length; i++) {
                let layer = state.layers[i];
                layers.push(layer);
                if (layer.class === LAKES) {
                    for (let j = 0; j < layer.features.features.length; j++) {
                        let lake = layer.features.features[j];
                        lake.show_bathymetry = true;
                    }
                }
            }
            return {
                ...state,
                layers: layers,
                error: ''
            };
        }
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            let layer = state.layers[i];
            if (layer.klass === action.klass) {
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
        if (action.klass === BATHYMETRY) {
            layers = [];
            for (let i = 0; i < state.layers.length; i++) {
                let layer = state.layers[i];
                layers.push(layer);
                if (layer.class === LAKES) {
                    for (let j = 0; j < layer.features.features.length; j++) {
                        let lake = layer.features.features[j];
                        lake.show_bathymetry = false;
                    }
                }
            }
            return {
                ...state,
                layers: layers,
                error: ''
            };
        }
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            let layer = state.layers[i];
            if (layer.klass === action.klass) {
                layer.visible = false;
            }
            layers.push(layer);
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case SELECT_FEATURE:
        return {
            ...state,
            selected_feature: state.features[action.index],
            error: ''
        };
    case UNSELECT_FEATURE:
        return {
            ...state,
            selected_feature: null,
            error: ''
        };
    case SELECT_LAKE:
        lakes = null;
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            layers.push(state.layers[i]);
            if (state.layers[i].class === LAKES) {
                lakes = state.layers[i];
                let lake = lakes.features.features[action.index];
                lake.show_bathymetry = true;
            }
        }
        return {
            ...state,
            layers: layers,
            lakes: lakes,
            error: ''
        };
    case UNSELECT_LAKE:
        lakes = null;
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            layers.push(state.layers[i]);
            if (state.layers[i].class === LAKES) {
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
    case SET_ZOOM:
        return {
            ...state,
            zoom: action.level,
            error: ''
        };
    case SET_ACTIVE:
        let leafs = {};
        for (let [i, leaf] of Object.entries(state.leafs)) {
            if (leaf.klass === action.klass) {
                leaf.active = 1;
            }
            leafs[i] = leaf;
        }
        return {
            ...state,
            leafs: leafs,
            error: ''
        };
    case SET_UNACTIVE:
        leafs = {};
        for (let [i, leaf] of Object.entries(state.leafs)) {
            if (leaf.klass === action.klass) {
                leaf.active = 0;
            }
            leafs[i] = leaf;
        }
        return {
            ...state,
            leafs: leafs,
            error: ''
        };
    case SET_FOCUSED:
        return {
            ...state,
            focused: action.focused,
            error: ''
        };
    default:
        return state;
    }
}

export default initReducer;
