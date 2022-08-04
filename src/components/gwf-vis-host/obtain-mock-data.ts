export function obtainShape(_dataset: string) {
  return {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            id: '1',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-121.28906250000001, 53.12040528310657],
                [-113.5546875, 53.12040528310657],
                [-113.5546875, 57.89149735271034],
                [-121.28906250000001, 57.89149735271034],
                [-121.28906250000001, 53.12040528310657],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          properties: {
            id: '2',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-110.390625, 57.136239319177434],
                [-117.42187500000001, 54.36775852406841],
                [-113.203125, 51.39920565355378],
                [-108.6328125, 53.12040528310657],
                [-105.1171875, 56.17002298293205],
                [-110.390625, 57.136239319177434],
              ],
            ],
          },
        },
      ],
    },
  };
}

export function obtainValue(_dataset: string, _locationId: string, _variable: string, _dimensionDict: { [dimension: string]: number }) {
  return Math.random() * 100;
}

export function obtainMetadata(_dataset: string, _locationId: string) {
  return {
    One: 'Something',
    Two: 'Something else',
  };
}
