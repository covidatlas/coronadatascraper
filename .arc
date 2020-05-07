@app
covid-atlas

@aws
profile covidatlas
region us-west-1

@cdn

@static
fingerprint true

@http
get /
get /sandbox
get /about
get /map
get /crosscheck
get /sources
get /data
get /api/search
get /embed/:location
get /api/locations/:location
get /api/features/:location
get /api/timeseries/:location
get /:location # normalized lowercased space -> dash: King County, WA, USA -> king-county-wa-usa
# generate map of slugs for each location from locations.json

# @events
# crawler
# processor

# @scheduled
# runner

@macros
architect/macro-node-prune
build
