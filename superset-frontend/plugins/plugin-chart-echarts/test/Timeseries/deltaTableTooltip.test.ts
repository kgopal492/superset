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
import { ChartDataResponseResult, DataRecord } from '@superset-ui/core';
import { GenericDataType } from '@apache-superset/core/common';
import transformProps from '../../src/Timeseries/transformProps';
import { EchartsTimeseriesChartProps } from '../../src/types';
import {
  EchartsTimeseriesSeriesType,
  EchartsTimeseriesFormData,
} from '../../src/Timeseries/types';
import { DEFAULT_FORM_DATA } from '../../src/Timeseries/constants';
import { createEchartsTimeseriesTestChartProps } from '../helpers';

const DAY = 24 * 60 * 60 * 1000;
const BASE = Date.UTC(2024, 0, 1);
const XCOL = 'order_date';
const METRIC = 'SUM(sales)';

const rows: DataRecord[] = Array.from({ length: 10 }, (_, i) => ({
  [XCOL]: BASE + i * DAY,
  [METRIC]: 100 + i * 10,
}));

function createTestQueryData(): ChartDataResponseResult {
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

function buildFormData(): EchartsTimeseriesFormData {
  return {
    ...DEFAULT_FORM_DATA,
    viz_type: 'echarts_timeseries_line',
    x_axis: XCOL,
    xAxis: XCOL, // camelCased form_data
    metrics: [METRIC],
    groupby: [],
    seriesType: EchartsTimeseriesSeriesType.Line,
    richTooltip: true,
    pinterestDeltaTable: true,
    pinterestDeltaTableColumns: ['D/D', 'W/W'],
  } as unknown as EchartsTimeseriesFormData;
}

function renderTooltip(datasource?: {
  verboseMap: Record<string, string>;
  columnFormats: Record<string, string>;
  currencyFormats: Record<string, never>;
}): string {
  const queriesData = [createTestQueryData()];
  const chartProps = createEchartsTimeseriesTestChartProps<
    EchartsTimeseriesFormData,
    EchartsTimeseriesChartProps
  >({
    defaultFormData: DEFAULT_FORM_DATA as unknown as EchartsTimeseriesFormData,
    defaultVizType: 'echarts_timeseries_line',
    defaultQueriesData: queriesData,
    formData: buildFormData(),
    queriesData,
    ...(datasource ? { datasource } : {}),
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

test('delta table tooltip renders values for a Generic X-Axis timeseries', () => {
  const html = renderTooltip();
  expect(html).toContain('>150<');
  expect(html).not.toContain('>null<');
});

test('delta table tooltip renders values when the x-axis column has a verbose name', () => {
  // Datasets commonly define a verbose (display) name for the time column.
  // The tooltip must still key its data by the physical column label, which is
  // how the raw query response is keyed.
  const html = renderTooltip({
    verboseMap: { [XCOL]: 'Order Date', [METRIC]: 'Total Sales' },
    columnFormats: {},
    currencyFormats: {},
  });
  expect(html).toContain('>150<');
  expect(html).not.toContain('>null<');
});
