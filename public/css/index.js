import React, {StyleSheet, Dimensions, PixelRatio} from "react-native";
const {width, height, scale} = Dimensions.get("window"),
    vw = width / 100,
    vh = height / 100,
    vmin = Math.min(vw, vh),
    vmax = Math.max(vw, vh);

export default StyleSheet.create({
    "body": {
        "marginTop": 0,
        "marginRight": 0,
        "marginBottom": 0,
        "marginLeft": 0,
        "paddingBottom": 0,
        "fontFamily": "\"Times New Roman\", Times, serif",
        "backgroundColor": "#F5FAFA",
        "maxWidth": "100%",
        "textOverflow": "clip",
        "overflowX": "hidden",
        "backgroundImage": "url(\"../media/MarketSquare.jpg\")"
    },
    "phoneEx": {
        "minWidth": 700,
        "minHeight": 700,
        "maxWidth": 30 * vw,
        "maxHeight": 70 * vh
    },
    "titleTxt": {
        "borderRadius": 10,
        "width": 50 * vw,
        "maxWidth": 800,
        "textAlign": "center",
        "marginRight": "auto",
        "marginLeft": "auto",
        "marginBottom": 5 * vh,
        "marginTop": 1.5 * vh,
        "paddingBottom": 1 * vh,
        "paddingTop": 1 * vh,
        "fontStyle": "italic",
        "fontFamily": "fantasy"
    },
    "descriptionTxt": {
        "fontFamily": "serif",
        "borderRadius": 10,
        "minWidth": 200,
        "paddingLeft": 5,
        "paddingRight": 5,
        "width": 20 * vw,
        "lineHeight": "200%",
        "fontSize": 20,
        "maxWidth": 335,
        "marginTop": 100,
        "textAlign": "left",
        "backgroundColor": "rgba(255,255,255,0.5)"
    },
    "functionBlock>*": {
        "float": "left"
    },
    "waffles>*": {
        "marginRight": "auto",
        "marginLeft": "auto",
        "width": 1200,
        "backgroundColor": "rgba(255,255,255,0.5)"
    },
    "jenga": {
        "float": "left"
    }
});