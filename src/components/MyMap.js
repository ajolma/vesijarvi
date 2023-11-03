import React, { Component } from 'react';
import ReactDOMServer from "react-dom/server";
import {connect} from 'react-redux';
import {Map, TileLayer, GeoJSON,
        Polygon, Polyline, Tooltip, ScaleControl} from 'react-leaflet';
import L from 'leaflet';
import {mapsPlaceHolder} from '../index.js';
import './MyMap.css';
import { ControlledPopup } from './MyPopup';

function element(tag, attrs, text) {
    var a = '';
    for (var key in attrs) {
        if (attrs.hasOwnProperty(key)) {
            a += ' ' + key + '="' + attrs[key] + '"';
        }
    }
    if (text)
        return '<'+tag+a+'>'+text+'</'+tag+'>';
    else
        return '<'+tag+a+'/>';
}

function paragraph(h, t) {
    if (!t) {
        return '';
    }
    return '<p><b>' + h +'</b>' + t + '</p>';
}

function kuvatHTML(kuvat) {
    if (!kuvat) {
        return '';
    }
    var filenames = kuvat.split(/,/),
        html = '',
        name,
        poster,
        src,
        scale,
        i;
    for (i = 0; i < filenames.length; i++) {
        name = filenames[i];

        if (name.substring(0,7) === "http://" || name.substring(0,8) === "https://") {
            src = name;
            let regex = /\(([\d%]+)\)$/;
            let m = src.match(regex);
            if (m) {
                src = src.replace(m[0], '');
                scale = m[1];
            }
        } else {
            src = process.env.PUBLIC_URL + '/media/' + name;
        }

        if (/mp4/.test(name)) {
            poster = name.match(/(\w+).mp4$/);
            let attrs = {
                width: 270,
                height: 200,
                controls: true,
                preload: "none",
                poster: process.env.PUBLIC_URL + '/media/' + poster[1] + '.jpeg'
            };
            //attrs.autoplay = 'autoplay';
            html += element('video',
                            attrs,
                            element('source', {src:src, type:'video/mp4'})) +
                'Videon lataus voi kestää hetken.';
            //html += ' Se käynnistyy automaattisesti latauduttuaan.';
        } else {
            if (scale) {
                html += '<img src="' + src + '" width="' + scale + '" height="' + scale + '"/><br />';
            } else {
                html += '<img src="' + src + '"/><br />';
            }
        }
    }
    return html;
}

export const popupHtml = (popup, feature) => {
    let html = '<h3>' + feature.properties.nimi + '</h3>';
    for (let i = 0; i < popup.length; i++) {
        let t = feature.properties[popup[i].sarake];
        if (!t) {
            continue;
        }
        if (popup[i].otsikko === 'kuvat') {
            html += kuvatHTML(feature.properties.kuvat);
        } else if (popup[i].otsikko === 'Tyyppi') {
            html += '<h4>'+t+'</h4>';
        } else if (typeof t === 'string' && t.startsWith('http')) {
            html += '<a href="' + t + '" target="_blank">' + popup[i].otsikko + '</a>';
        } else {
            html += paragraph(popup[i].otsikko + ': ', t);
        }
    }
    return html;
};

let map = null;
let my_map = null;

function onEachFeature(feature, layer) {
    if (my_map) {
        layer.bindPopup(popupHtml(my_map.props.popup, feature));
    }
}

const CustomReactPopup = () => {
  return (
    <div style={{ fontSize: "24px", color: "black" }}>
      <p>A pretty React Popup</p>
    </div>
  );
};

function clickOnPolygon(layer) {
    return (p) => {
        console.log('p',p);
        console.log('layer',layer);
        //ReactDOMServer.renderToString(<CustomReactPopup />);
    };
}

export function getMapZoom() {
    return map && map.leafletElement.getZoom();
}

export function closePopups() {
    return map && map.leafletElement.closePopup();
}

class MyMap extends Component {

    constructor(props) {
        super(props);
        this.state = {};
        my_map = this;
    }

    initialized = false;

    render() {

        if (this.props.layers.length === 0) {
            if (map !== null) {
                let loading = process.env.PUBLIC_URL + '/media/loading.gif';
                let alt = 'Sivua ladataan ...';
                let msg = '<img src="' + loading + '" alt="' + alt + '" width="64" height="64"/>';
                L.popup({closeButton: false})
                    .setLatLng(this.props.latlng)
                    .setContent(msg)
                    .openOn(mapsPlaceHolder[0]);
            }
        } else if (!this.initialized) {
            closePopups();
            this.initialized = true;
        }

        if (map) {
            map.leafletElement.on('zoomstart', function() {
                console.log('zoom is ', getMapZoom());
            });
        }

        let key = 1;
        let overlays = [];
        for (let i = 0; i < this.props.backgrounds.length; i++) {
            let bg = this.props.backgrounds[i];
            if (bg.visible) {
                overlays.push(
                    <TileLayer key={key}
                               attribution={bg.attribution}
                               url={bg.url}/>);
                break;
            }
        }
        key++;
        for (let i = 0; i < this.props.layers.length; i++) {
            let layer = this.props.layers[i];
            if (layer.visible && layer.table.substr(0, 4) === 'http') {
                overlays.push(
                    <TileLayer
                        key={key}
                        attribution=''
                        tms='true'
                        opacity={layer.opacity}
                        url={layer.table}
                    />);
            }
            key++;
        }
        if (this.props.lakes) {
            for (let i = 0; i < this.props.lakes.features.features.length; i++) {
                let lake = this.props.lakes.features.features[i];
                if (lake.bathymetry && lake.show_bathymetry) {
                    let fill_opacity = lake.properties.fill_opacity;
                    let stroke = false;
                    for (let k = 0; k < lake.bathymetry.length; k++) {
                        let ps = lake.bathymetry[k];
                        let polygon = [];
                        for (let j = 0; j < ps.length; j++) {
                            polygon.push(ps[j]);
                        }
                        overlays.push(<Polygon key={key}
                                               fillColor="blue"
                                               fillOpacity={fill_opacity}
                                               stroke={stroke}
                                               opacity={fill_opacity}
                                               positions={polygon} />);
                        key++;
                    }
                }
            }
        } else {
            key += 20*40;
        }
        for (let i = 0; i < this.props.layers.length; i++) {
            let layer = this.props.layers[i];
            if (layer.visible && layer.table.substr(0, 4) !== 'http') {
                if (layer.geometry_type === 'Polyline') {
                    let c = layer.features.coordinates;
                    let p = layer.features.properties;
                    if (c) {
                        for (let k = 0; k < c.length; k++) {
                            let ps = c[k];
                            let polyline = [];
                            for (let j = 0; j < ps.length; j++) {
                                polyline.push(ps[j]);
                            }
                            overlays.push(
                                <Polyline key={key}
                                          stroke="true"
                                          color={layer.stroke_color}
                                          weight={layer.stroke_width}
                                          opacity={layer.opacity}
                                          positions={polyline}>
                                    <Tooltip>{p[k].nimi}</Tooltip>
                                </Polyline>
                            );
                            key++;
                        }
                    }
                } else if (layer.geometry_type === 'Polygon') {
                    let c = layer.features.coordinates;
                    let p = layer.features.properties;
                    if (c) {
                        for (let k = 0; k < c.length; k++) {
                            let ps = c[k];
                            let polygon = [];
                            for (let j = 0; j < ps.length; j++) {
                                polygon.push(ps[j]);
                            }
                            let tooltip = '';
                            if (p[k].nimi) {
                                tooltip = <Tooltip>{p[k].nimi}</Tooltip>;
                            }
                            let fill_color = layer.fill_color;
                            if (p[k].fill_color) {
                                fill_color = p[k].fill_color;
                            }
                            let onClick = null;
                            if (layer.popup) {
                                //console.log(overlay);
                                onClick = clickOnPolygon(p[k]);
                                // onClick={onClick}
                                /*
                                overlay.bindPopup(
                                    popupHtml(
                                        my_map.props.popup,
                                        {properties: p[i]}
                                    )
                                );
                                */
                            }
                            let overlay = <Polygon key={key}
                                                   fillColor={fill_color}
                                                   fillOpacity={layer.fill_opacity}
                                                   stroke="true"
                                                   color={layer.stroke_color}
                                                   weight={layer.stroke_width}
                                                   opacity={layer.opacity}
                                                   onClick={onClick}
                                                   positions={polygon}>
                                            {tooltip}
                                          </Polygon>;
                            overlays.push(overlay);
                            key++;
                        }
                    }
                }
            } else {
                key += 200;
            }
        }
        for (let i = 0; i < this.props.layers.length; i++) {
            let layer = this.props.layers[i];
            let features = layer.features;
            if (layer.geometry_type === 'Point'
                && features.totalFeatures > 0
                && layer.visible
                && features.features) {
                overlays.push(
                    <GeoJSON key={key}
                             data={features}
                             pointToLayer={layer.style}
                             onEachFeature={onEachFeature}>
                    </GeoJSON>
                );
            }
            key++;
        }
        return (
            <Map ref={(ref) => {map = ref;}}
                 center={this.props.latlng}
                 zoom={this.props.zoom}
                 minZoom="9"
                 maxZoom="18">
                 {overlays}
                 <ScaleControl imperial="false"/>
            </Map>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        latlng: state.init.latlng,
        zoom: state.init.zoom,
        popup: state.init.popup,
        layers: state.init.layers,
        lakes: state.init.lakes,
        features: state.init.features,
        selected_feature: state.init.selected_feature,
        backgrounds: state.init.backgrounds,
        error: state.init.error
    };
}

export default connect(mapStateToProps)(MyMap);
