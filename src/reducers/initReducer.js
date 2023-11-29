//import {getMapZoom} from '../components/MyMap';
import L from 'leaflet';

import {
    BUTTONS, ESTATES, BATHYMETRIES,
    GET_LEAFS_OK, GET_LEAFS_FAIL,
    GET_POPUP_OK, GET_POPUP_FAIL,
    GET_LAYERS_OK, GET_LAYERS_FAIL,
    GET_OIKEUDET_OK, GET_OIKEUDET_FAIL,
    GET_BACKGROUND_OK, GET_BACKGROUND_FAIL,
    GET_FLAGS_OK, GET_FLAGS_FAIL,
    GET_ESTATES_OK, GET_ESTATES_FAIL,
    GET_ESTATE_GEOM_OK, GET_ESTATE_GEOM_FAIL,
    GET_BATHYMETRY_OK, GET_BATHYMETRY_FAIL,
    SELECT_BACKGROUND,
    SHOW_LAYER, SHOW_LAYERS, HIDE_LAYER, HIDE_LAYERS,
    SHOW_LEAF, HIDE_LEAF,
    SHOW_FEATURE, HIDE_FEATURE,
    REFRESH,
    SELECT_FEATURE,
    UNSELECT_FEATURE,
    SELECT_LAKE,
    UNSELECT_LAKE,
    SET_ACTIVE,
    SET_UNACTIVE,
    SET_FOCUSED,
    ENABLE_HIDING,
    FIT_BOUNDS_FINALLY,
} from '../actions/initAction';
import { fitBounds } from '../components/MyMap';

export const LAKES = 'lakes';

export const expandBounds = (bounds, withBounds) => {
    let b = withBounds;
    if (bounds) {
        if (b[0][0] < bounds[0][0]) {
            bounds[0][0] = b[0][0];
        }
        if (b[0][1] < bounds[0][1]) {
            bounds[0][1] = b[0][1];
        }
        if (b[1][0] > bounds[1][0]) {
            bounds[1][0] = b[1][0];
        }
        if (b[1][1] > bounds[1][1]) {
            bounds[1][1] = b[1][1];
        }
    } else {
        bounds = [[b[0][0], b[0][1]], [b[1][0], b[1][1]]];
    }
    return bounds;
}

export const getBounds = (coordinates, bounds) => {
    let set_minmax_from = (x, y) => {
        if (Array.isArray(x)) {
            //console.log('error');
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
};

export const setBounds = (layers) => {
    let bounds = null;
    for (let i = 0; i < layers.length; i++) {
        let layer = layers[i];
        let is_point = layer.geometry_type === 'Point';
        let is_poly = layer.geometry_type === 'Polygon' || layer.geometry_type === 'Polyline';
        if (layer.table && layer.table.startsWith('https')) {
            continue;
        }
        if (is_point && layer.visible && layer.features) {
            //console.log(layer);
            for (let i = 0; i < layer.features.features.length; i++) {
                let feature = layer.features.features[i];
                bounds = getBounds(feature.geometry.coordinates, bounds);
            }
        } else if (is_poly && layer.visible && layer.features) {
            //console.log(layer);
            let feature = layer.features;
            bounds = getBounds(feature.coordinates);
        }
        //console.log('setting bounds',bounds,layer.name,layer.table);
    }
    if (bounds) {
        //console.log('fit bounds',bounds);
        fitBounds(bounds);
    }
};

const initialState = {
    latlng: [61.05, 25.55],
    zoom: 11,
    leafs: [],
    popup: [],
    layers: [],
    features: [],
    selected_feature: null,
    backgrounds: [],
    flags: [],
    oikeudet: {},
    focused: true,
    error: undefined
};

const initiallyVisible = {};

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
    console.log(action);
    let leafs;
    let bounds;
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
        let layers = [];
        let features = [];
        for (let i = 0; i < state.layers.length; i++) {
            let layer = state.layers[i];
            initiallyVisible[layer.name] = layer.visible;
            layers.push(layer);
        }
        for (let i = 0; i < state.features.length; i++) {
            features.push(state.features[i]);
        }
        for (let layer of action.data) {
            layer.id = crypto.randomUUID();
            if (layer.klass === LAKES) {
                // add bathymetries as a layer whose features can be individually visible/hidden
                // they are initially deferred (have no geometry) and not visible
                console.log('lakes', layer);
                let from_lakes = [];
                for (let lake of layer.features.features) {
                    if (lake.properties.syvyyskartta) {
                        from_lakes.push({
                            geometry: null,
                            properties: {
                                id: lake.properties.id,
                                nimi: lake.properties.nimi,
                                fill_opacity: lake.properties.fill_opacity,
                            }
                        });
                    }
                }
                if (from_lakes) {
                    layers.push({
                        id: crypto.randomUUID(),
                        klass: BATHYMETRIES,
                        features: {
                            features: from_lakes,
                        },
                        visible: false,
                    });
                }
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
        if (state.focused && action.fitBoundsFinallyPending === 0) {
            //console.log('finally');
            setBounds(state.layers);
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
            features: features,
            error: ''
        };
    case GET_LAYERS_FAIL:
        return {
            ...state,
            error: action.error
        };
    case GET_ESTATES_OK:
        layers = [];
        for (let layer of state.layers) {
            layers.push(layer);
        }
        // estates is one layer whose features can be individually visible/hidden
        // and they are initially deferred (have no geometry) and not visible
        let layer = action.data[0];
        layer.id = crypto.randomUUID();
        for (let estate of layer.features.features) {
            estate.visible = false;
        }
        layers.push(layer);
        return {
            ...state,
            estates: action.data[0].features.properties,
            layers: layers,
            error: ''
        };
    case GET_ESTATES_FAIL:
        return {
            ...state,
            error: action.error
        };
    case GET_ESTATE_GEOM_OK:
        layers = [];
        bounds = null;
        for (let layer of state.layers) {
            layers.push(layer);
            if (layer.klass === ESTATES) {
                for (let estate of layer.features.features) {
                    if (estate.properties.id === action.data.properties.id) {
                        estate.geometry = action.data.geometry;
                        estate.geometry.bounds = getBounds(estate.geometry.coordinates);
                        estate.visible = true;
                    }
                    if (estate.geometry && estate.geometry.bounds && estate.visible) {
                        bounds = expandBounds(bounds, estate.geometry.bounds);
                    }
                }
            }
        }
        console.log(bounds, state.focused, action.fitBoundsFinallyPending);
        if (bounds && state.focused && action.fitBoundsFinallyPending === 0) {
            fitBounds(bounds);
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case GET_BATHYMETRY_OK:
        layers = [];
        bounds = null;
        for (let layer of state.layers) {
            layers.push(layer);
            if (layer.klass === BATHYMETRIES) {
                for (let bathymetry of layer.features.features) {
                    if (bathymetry.properties.id === action.data.properties.id) {
                        bathymetry.geometry = action.data.geometry;
                        bathymetry.geometry.bounds = getBounds(bathymetry.geometry.coordinates);
                        bathymetry.visible = true;
                    }
                    if (bathymetry.geometry &&  bathymetry.geometry.bounds &&  bathymetry.visible) {
                        bounds = expandBounds(bounds,  bathymetry.geometry.bounds);
                    }
                }
            }
        }
        console.log(bounds, state.focused, action.fitBoundsFinallyPending);
        if (bounds && state.focused && action.fitBoundsFinallyPending == 0) {
            fitBounds(bounds);
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case GET_BATHYMETRY_FAIL:
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
    case GET_ESTATE_GEOM_FAIL:
        return {
            ...state,
            error: action.error
        };
    case SHOW_FEATURE:
        layers = [];
        bounds = null;
        for (let layer of state.layers) {
            layers.push(layer);
            if (layer.klass === action.klass) {
                for (let feature of layer.features.features) {
                    if (feature.properties.id === action.feature.properties.id) {
                        feature.visible = true;
                    }
                    if (feature.visible && feature.geometry && feature.geometry.bounds) {
                        bounds = expandBounds(bounds, feature.geometry.bounds);
                    }
                }
            }
            if (layer.klass === BUTTONS && layer.legend === 'HideButton') {
                layer.visible = true;
            }
        }
        if (bounds && state.focused && action.fitBoundsFinallyPending === 0) {
            fitBounds(bounds);
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case HIDE_FEATURE:
        layers = [];
        for (let layer of state.layers) {
            layers.push(layer);
            if (layer.klass === action.klass) {
                for (let feature of layer.features.features) {
                    if (feature.properties.id === action.feature.properties.id) {
                        feature.visible = false;
                    }
                }
            }
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case SHOW_LAYER:
        layers = [];
        for (let layer of state.layers) {
            layers.push(layer);
            if (layer.id === action.layer.id) {
                layer.visible = true;
            }
            if (layer.klass === BUTTONS && layer.legend === 'HideButton') {
                layer.visible = true;
            }
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case SHOW_LAYERS:
        layers = [];
        for (let layer of state.layers) {
            layers.push(layer);
            if (initiallyVisible[layer.name]) {
                layer.visible = true;
            }
            if (layer.klass === BUTTONS && layer.legend === 'HideButton') {
                layer.visible = true;
            }
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case HIDE_LAYER:
        layers = [];
        for (let layer of state.layers) {
            layers.push(layer);
            if (layer.id === action.layer.id) {
                layer.visible = false;
            }
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case HIDE_LAYERS:
        layers = [];
        for (let layer of state.layers) {
            layers.push(layer);
            if (layer.klass === BATHYMETRIES || layer.klass === ESTATES) {
                for (let j = 0; j < layer.features.features.length; j++) {
                    for (let feature of layer.features.features) {
                        feature.visible = false;
                    }
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
        layers = [];
        for (let layer of state.layers) {
            layers.push(layer);
            if (layer.klass !== action.klass) {
                continue;
            }
            if (action.klass === BATHYMETRIES || action.klass === ESTATES) {
                for (let feature of layer.features.features) {
                    feature.visible = true;
                }
            } else {
                layer.visible = true;
            }
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case HIDE_LEAF:
        layers = [];
        for (let layer of state.layers) {
            layers.push(layer);
            if (layer.klass !== action.klass) {
                continue;
            }
            if (action.klass === BATHYMETRIES || action.klass === ESTATES) {
                for (let feature of layer.features.features) {
                    feature.visible = false;
                }
            } else {
                layer.visible = false;
            }
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case REFRESH:
        layers = [];
        for (let layer of state.layers) {
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
    case SET_ACTIVE:
        leafs = [];
        for (let leaf of state.leafs) {
            if (leaf.klass === action.klass) {
                leaf.active = 1;
            }
            leafs.push(leaf);
        }
        return {
            ...state,
            leafs: leafs,
            error: ''
        };
    case SET_UNACTIVE:
        leafs = [];
        for (let leaf of state.leafs) {
            if (leaf.klass === action.klass) {
                leaf.active = 0;
            }
            leafs.push(leaf);
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
    case ENABLE_HIDING:
        layers = [];
        for (let i = 0; i < state.layers.length; i++) {
            let layer = state.layers[i];
            if (layer.klass === "buttons" && layer.legend === 'HideButton') {
                layer.visible = true;
            }
            layers.push(layer);
        }
        return {
            ...state,
            layers: layers,
            error: ''
        };
    case FIT_BOUNDS_FINALLY:
        return state;
    default:
        return state;
    }
}

export default initReducer;
