/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {
  ChartDataResponseResult,
  DataRecord,
  VizType,
} from '@superset-ui/core';
import { GenericDataType } from '@apache-superset/core/common';
import transformProps from '../../src/MixedTimeseries/transformProps';
import {
  EchartsMixedTimeseriesFormData,
  EchartsMixedTimeseriesProps,
  DEFAULT_FORM_DATA,
} from '../../src/MixedTimeseries/types';
import { createEchartsTimeseriesTestChartProps } from '../helpers';

const DAY = 24 * 60 * 60 * 1000;
const BASE = Date.UTC(2024, 0, 1);
const XCOL = 'ds';
const METRIC = 'SUM(sales)';

const rowsA: DataRecord[] = Array.from({ length: 10 }, (_, i) => ({
  [XCOL]: BASE + i * DAY,
  [METRIC]: 100 + i * 10,
}));
const rowsB: DataRecord[] = Array.from({ length: 10 }, (_, i) => ({
  [XCOL]: BASE + i * DAY,
  [METRIC]: 50 + i * 10,
}));

function createTestQueryData(rows: DataRecord[]): ChartDataResponseResult {
  return {
    annotation_data: null,
    cache_key: null,
    cache_timeout: null,
    cached_dttm: null,
    queried_dttm: null,
    data: rows,
    colnames: [XCOL, METRIC],
    coltypes: [GenericDataType.Temporal, GenericDataType.Numeric],
    error: null,
    is_cached: false,
    query: '',
    rowcount: rows.length,
    sql_rowcount: rows.length,
    stacktrace: null,
    status: 'success',
    from_dttm: null,
    to_dttm: null,
    label_map: { [XCOL]: [XCOL], [METRIC]: [METRIC] },
  } as unknown as ChartDataResponseResult;
}

function renderTooltip(showQueryIdentifiers: boolean): string {
  const queriesData = [createTestQueryData(rowsA), createTestQueryData(rowsB)];
  const chartProps = createEchartsTimeseriesTestChartProps<
    EchartsMixedTimeseriesFormData,
    EchartsMixedTimeseriesProps
  >({
    defaultFormData: DEFAULT_FORM_DATA,
    defaultVizType: 'mixed_timeseries',
    defaultQueriesData: queriesData,
    formData: {
      ...DEFAULT_FORM_DATA,
      viz_type: VizType.MixedTimeseries,
      x_axis: XCOL,
      xAxis: XCOL,
      metrics: [METRIC],
      metricsB: [METRIC],
      groupby: [],
      groupbyB: [],
      richTooltip: true,
      showQueryIdentifiers,
      pinterestDeltaTable: true,
      pinterestDeltaTableColumns: ['D/D', 'W/W'],
    } as unknown as EchartsMixedTimeseriesFormData,
    queriesData,
  });

  const transformed = transformProps(chartProps);
  const series = transformed.echartOptions.series as {
    id: string;
    name: string;
    data: [number, number][];
  }[];
  const { formatter } = transformed.echartOptions.tooltip as {
    formatter: (params: unknown) => string;
  };

  const idx = 5;
  const params = series
    .filter(s => Array.isArray(s.data) && s.data[idx] != null)
    .map(s => ({
      seriesId: s.id,
      seriesName: s.name,
      marker: '●',
      value: s.data[idx],
    }));
  return formatter(params);
}

test('mixed delta table tooltip renders values without query identifiers', () => {
  const html = renderTooltip(false);
  expect(html).toContain('>150<');
  expect(html).toContain('>100<');
  expect(html).not.toContain('>null<');
});

test('mixed delta table tooltip renders values with query identifiers', () => {
  const html = renderTooltip(true);
  expect(html).toContain('>150<');
  expect(html).toContain('>100<');
  expect(html).not.toContain('>null<');
});
