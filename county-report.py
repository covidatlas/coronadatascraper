#!/usr/bin/env python

import json
import csv
import sys
from datetime import date

import dateparser
from collections import defaultdict

from dump import dump


def toint(v):
    try:
        return int(v)
    except ValueError:
        return 0

def get_county_pops():
    fname = 'coronavirus-data-sources/population/population-usa-counties.csv'
    reader = csv.reader(open(fname))

    state_counties = defaultdict(set)
    county_pop = dict()

    for row in reader:
        pop = toint(row[1])
        if not pop:
            continue

        county_state = row[0]
        county_pop[county_state] = pop

        #dump(county_state)
        county, state = county_state.split(', ')
        state_counties[state].add(county_state)

    return county_pop, state_counties

county_pop, state_to_counties = get_county_pops()

reader = csv.reader(open(sys.argv[1]))

counties = defaultdict(int)
states = []

have_counties = set()

for row in reader:
    #dump(row) ; sys.exit()

    city,county,state,country = row[:4]

    todays_count = toint(row[-1])

    if not todays_count:
        continue

    if country != 'USA':
        continue

    county = f'{county}, {state}'
    have_counties.add(county)

missing_counties = []

for county,pop in county_pop.items():
    if county in have_counties:
        continue
    missing_counties.append( (pop, county) )

missing_counties = sorted(missing_counties, reverse = True)
for pop,county in missing_counties:
    print(pop, county)

dump(len(missing_counties))
