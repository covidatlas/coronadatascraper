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

# @events
# crawler
# processor

# @scheduled
# runner

@macros
architect/macro-node-prune
