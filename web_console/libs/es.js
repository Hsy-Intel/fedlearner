/**
 * Elastic Search Client
 */

const ky = require('ky-universal');

let config;
try {
    config = require('../server.config');
} catch (err) {
    config = require('../constants').DEFAULT_SERVER_CONFIG;
}



class ElasticSearchClient {
    constructor() {
        // TODO: use HTTPs for production
        const prefixUrl = `http://${process.env.ES_HOST || config.ES_HOST}:${process.env.ES_PORT || config.ES_PORT}`;
        this.client = ky.create({ prefixUrl });
    }

    async queryLog(index, keyword, pod_name, start_time, end_time) {
        let query_body = {
            "sort": [
                {
                    "@timestamp": {
                        "order": "asc",
                        "unmapped_type": "boolean"
                    }
                }
            ],
            "_source": ["message"],
            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": `\"${keyword}\"`,
                                "analyze_wildcard": true,
                                "default_field": "*"
                            }
                        },
                        {
                            "match_phrase": {
                                "kubernetes.pod.name": {
                                    "query": pod_name
                                }
                            }
                        },
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": start_time,
                                    "lte": end_time,
                                    "format": "epoch_millis"
                                }
                            }
                        }
                    ]
                }
            }
        }

        const body = await this.client.post(`${index}/_search`, { json: query_body }).json();
        return Object.keys(body.hits.hits).map(x => body.hits.hits[x]['_source']['message']);
    }
}

module.exports = ElasticSearchClient;