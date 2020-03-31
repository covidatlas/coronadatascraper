
The main fields are the following, plus the geographical entity fields explained below:

* date: the date the data point refers to
* type: the type of data point: cases, tested, deaths, hospitalized, discharged, or recovered
* value: the value of the data point (a cumulative count of events of a certain type)

Each observation is associated with a geographical entity, identified in the following four fields.


* city: the name of the city
* county: county or parish or the appropriate name of the administrative subdivision below the level of state or equivalent 
* state: state, province or region depending on jurisdiction. In general, the first administrative subdivision below the level of country.
* country:  ISO 3166-1 alpha-3 (three letter) country code 

The country field is mandatory. In general, whenever the record is about administrative subdivisions of a level, al including levels are non empty. One exception is New York City because it is subdivided into five counties.

The following fields are uniquely determined by the geographical entity and are provided as a convenience.

* population: a recent estimate of the population in the geographical entity
* lat: latitude of the geographical entity
* long: longitude of the geographical entity
* tz: time zone of the geographical entity 

Additional attributes of a data point are:

* url: the source for the data point
* aggregate: the original level of aggregation of the source, e.g. country level data may have been obtained directly or by summation of state or county level data. This field will clarify this.
