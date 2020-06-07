//sample messages (as returned from lob API endpoints)
var APIMock = module.exports = {
    deliverable_missing_unit: {
        "id": "us_ver_cac430d284034802a762",
        "recipient": "",
        "primary_line": "185 BERRY ST",
        "secondary_line": "",
        "urbanization": "",
        "last_line": "SAN FRANCISCO CA 94107-5705",
        "deliverability": "deliverable_missing_unit",
        "components": {
            "primary_number": "185",
            "street_predirection": "",
            "street_name": "BERRY",
            "street_suffix": "ST",
            "street_postdirection": "",
            "secondary_designator": "",
            "secondary_number": "",
            "pmb_designator": "",
            "pmb_number": "",
            "extra_secondary_designator": "",
            "extra_secondary_number": "",
            "city": "SAN FRANCISCO",
            "state": "CA",
            "zip_code": "94107",
            "zip_code_plus_4": "5705",
            "zip_code_type": "standard",
            "delivery_point_barcode": "941075705994",
            "address_type": "commercial",
            "record_type": "highrise",
            "default_building_address": true,
            "county": "SAN FRANCISCO",
            "county_fips": "06075",
            "carrier_route": "C001",
            "carrier_route_type": "city_delivery",
            "latitude": 37.776332,
            "longitude": -122.39181
        },
        "deliverability_analysis": {
            "dpv_confirmation": "D",
            "dpv_cmra": "N",
            "dpv_vacant": "N",
            "dpv_active": "N",
            "dpv_footnotes": [
                "AA",
                "N1"
            ],
            "ews_match": false,
            "lacs_indicator": "",
            "lacs_return_code": "",
            "suite_return_code": ""
        },
        "object": "us_verification"
    },
    undeliverable: {
        "id": "us_ver_670bf813cdf240dd9279",
        "recipient": "",
        "primary_line": "55XXX AVE",
        "secondary_line": "",
        "urbanization": "",
        "last_line": "SAN FRANCISCO CA 94107",
        "deliverability": "undeliverable",
        "components": {
            "primary_number": "55XXX",
            "street_predirection": "",
            "street_name": "AVE",
            "street_suffix": "",
            "street_postdirection": "",
            "secondary_designator": "",
            "secondary_number": "",
            "pmb_designator": "",
            "pmb_number": "",
            "extra_secondary_designator": "",
            "extra_secondary_number": "",
            "city": "SAN FRANCISCO",
            "state": "CA",
            "zip_code": "94107",
            "zip_code_plus_4": "",
            "zip_code_type": "standard",
            "delivery_point_barcode": "",
            "address_type": "",
            "record_type": "",
            "default_building_address": false,
            "county": "SAN FRANCISCO",
            "county_fips": "06075",
            "carrier_route": "",
            "carrier_route_type": "",
            "latitude": null,
            "longitude": null
        },
        "deliverability_analysis": {
            "dpv_confirmation": "",
            "dpv_cmra": "",
            "dpv_vacant": "",
            "dpv_active": "",
            "dpv_footnotes": [
                "A1"
            ],
            "ews_match": false,
            "lacs_indicator": "N",
            "lacs_return_code": "",
            "suite_return_code": ""
        },
        "object": "us_verification"
    },
    deliverable: {
        "id": "us_ver_44db0c7baa0f42408ecf",
        "recipient": "",
        "primary_line": "185 BERRY ST STE 6100",
        "secondary_line": "",
        "urbanization": "",
        "last_line": "SAN FRANCISCO CA 94107-1741",
        "deliverability": "deliverable",
        "components": {
            "primary_number": "185",
            "street_predirection": "",
            "street_name": "BERRY",
            "street_suffix": "ST",
            "street_postdirection": "",
            "secondary_designator": "STE",
            "secondary_number": "6100",
            "pmb_designator": "",
            "pmb_number": "",
            "extra_secondary_designator": "",
            "extra_secondary_number": "",
            "city": "SAN FRANCISCO",
            "state": "CA",
            "zip_code": "94107",
            "zip_code_plus_4": "1741",
            "zip_code_type": "standard",
            "delivery_point_barcode": "941071741259",
            "address_type": "commercial",
            "record_type": "highrise",
            "default_building_address": false,
            "county": "SAN FRANCISCO",
            "county_fips": "06075",
            "carrier_route": "C001",
            "carrier_route_type": "city_delivery",
            "latitude": 37.776332,
            "longitude": -122.39181
        },
        "deliverability_analysis": {
            "dpv_confirmation": "Y",
            "dpv_cmra": "N",
            "dpv_vacant": "N",
            "dpv_active": "Y",
            "dpv_footnotes": [
                "AA",
                "BB"
            ],
            "ews_match": false,
            "lacs_indicator": "",
            "lacs_return_code": "",
            "suite_return_code": ""
        },
        "object": "us_verification"
    },
    suggestions: {
        suggestions: [
            {
                "primary_line": "185 BERRY ST",
                "city": "SAN FRANCISCO",
                "state": "CA",
                "zip_code": "94107"
            }
        ]
    }
};