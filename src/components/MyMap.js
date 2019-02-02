import React, { Component } from 'react';
import {connect} from 'react-redux';
import {Map, TileLayer, GeoJSON, Polygon, Polyline, Tooltip} from 'react-leaflet';
import './MyMap.css';

var protocol = 'https';
var server = 'biwatech.com';
var mediaURL = protocol + '://' + server + '/Vj/media/';

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

function paragraph(t) {
    if (!t) {
        return '';
    }
    return '<p>' + t + '</p>';
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
        i;
    for (i = 0; i < filenames.length; i++) {
        name = filenames[i];

        if (name.substring(0,7) === "http://") {
            src = name;
        } else {
            src = mediaURL + name;
        }

        if (/mp4/.test(name)) {
            poster = name.match(/(\w+).mp4$/);
            let attrs = {
                width:270,
                height:200,
                controls:true,
                poster: mediaURL + poster[1] + '.jpeg'
            };
            //attrs.autoplay = 'autoplay';
            html += element('video', attrs, element('source', {src:src, type:'video/mp4'})) +
                'Videon lataus voi kestää hetken.';
            //html += ' Se käynnistyy automaattisesti latauduttuaan.';
        } else {
            html += "<img src=\"" + src + "\" /><br />";
        }
    }
    return html;
}

export const popupHtml = (feature, layer) => {
    return '<h3>'+feature.properties.nimi+'</h3>' +
        paragraph(feature.properties.kohdetyyppi) +
        paragraph(feature.properties.kuvaus) +
        kuvatHTML(feature.properties.kuvat);
};

let map = null;

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
    }

    onEachFeature(feature, layer) {
        layer.bindPopup(popupHtml(feature, layer));
    }

    render() {
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
            if (layer.leaf === 5 && layer.visible && layer.table.substr(0, 4) === 'http') {
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
        for (let i = 0; i < this.props.lakes.length; i++) {
            if (this.props.bathymetries[i]) {
                let f = this.props.bathymetries[i];
                for (let k = 0; k < f.length; k++) {
                    let ps = f[k];
                    let polygon = [];
                    for (let j = 0; j < ps.length; j++) {
                        polygon.push(ps[j]);
                    }
                    if (this.props.lakes[i].show_bathymetry) {
                        overlays.push(<Polygon key={key}
                                               fillColor="blue"
                                               fillOpacity="0.3"
                                               stroke="false"
                                               opacity="0.15"
                                               positions={polygon} />);
                    }
                    key++;
                }
            } else {
                key += 40;
            }
        }
        for (let i = 0; i < this.props.layers.length; i++) {
            let layer = this.props.layers[i];
            if (layer.leaf === 5 && layer.visible && layer.table.substr(0, 4) !== 'http') {
                if (layer.table === 'uomat') {
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
                } else {
                    let c = layer.features.coordinates;
                    let p = layer.features.properties;
                    if (c) {
                        for (let k = 0; k < c.length; k++) {
                            let ps = c[k];
                            let polygon = [];
                            for (let j = 0; j < ps.length; j++) {
                                polygon.push(ps[j]);
                            }
                            if (p[k].nimi) {
                                overlays.push(
                                    <Polygon key={key}
                                             fillColor={layer.fill_color}
                                             fillOpacity={layer.fill_opacity}
                                             stroke="true"
                                             color={layer.stroke_color}
                                             weight={layer.stroke_width}
                                             opacity={layer.opacity}
                                             positions={polygon}>
                                        <Tooltip>{p[k].nimi}</Tooltip>
                                    </Polygon>);
                            } else {
                                overlays.push(
                                    <Polygon key={key}
                                             fillColor={layer.fill_color}
                                             fillOpacity={layer.fill_opacity}
                                             stroke="true"
                                             color={layer.stroke_color}
                                             weight={layer.stroke_width}
                                             opacity={layer.opacity}
                                             positions={polygon}>
                                    </Polygon>);
                            }
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
            if (layer.leaf < 5
                && features.totalFeatures > 0
                && layer.visible
                && features.features) {
                overlays.push(
                    <GeoJSON key={key}
                             data={features}
                             pointToLayer={this.props.styles[i]}
                             onEachFeature={this.onEachFeature}>
                    </GeoJSON>
                );
            }
            key++;
        }
        return (
            <Map
                ref={(ref) => {map = ref;}}
                center={this.props.latlng} 
                zoom={this.props.zoom} >
                {overlays}
            </Map>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        latlng: state.init.latlng,
        zoom: state.init.zoom,
        layers: state.init.layers,
        features: state.init.features,
        selected_feature: state.init.selected_feature,
        styles: state.init.styles,
        bathymetries: state.init.bathymetries,
        lakes: state.init.lakes,
        backgrounds: state.init.backgrounds,
        error: state.init.error
    };
}

export default connect(mapStateToProps)(MyMap);
