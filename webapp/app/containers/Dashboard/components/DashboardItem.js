/*
 * <<
 * Davinci
 * ==
 * Copyright (C) 2016 - 2017 EDP
 * ==
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * >>
 */

import React, { PropTypes, PureComponent } from 'react'
import Animate from 'rc-animate'
import classnames from 'classnames'

import DashboardItemControlPanel from './DashboardItemControlPanel'
import DashboardItemControlForm from './DashboardItemControlForm'
import SharePanel from '../../../components/SharePanel'
import DownLoadCsv from '../../../components/DownLoadCsv'

import Chart from './Chart'
import Icon from 'antd/lib/icon'
import Tooltip from 'antd/lib/tooltip'
import Popconfirm from 'antd/lib/popconfirm'
import Popover from 'antd/lib/popover'
import Dropdown from 'antd/lib/dropdown'
import Menu from 'antd/lib/menu'

import { ECHARTS_RENDERER } from '../../../globalConstants'
import styles from '../Dashboard.less'

export class DashboardItem extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      controlPanelVisible: false,
      sharePanelAuthorized: false
    }
  }

  componentWillMount () {
    this.initControlCascadeSource(this.props)
  }

  componentDidMount () {
    const {
      itemId,
      widget,
      onGetChartData
    } = this.props

    onGetChartData('rerender', itemId, widget.id)

    this.setFrequent(this.props)
  }

  componentWillUpdate (nextProps) {
    const {
      itemId,
      widget,
      data,
      chartInfo,
      triggerType,
      onRenderChart
    } = nextProps
    if (data && data !== this.props.data && chartInfo.renderer === ECHARTS_RENDERER) {
      onRenderChart(itemId, widget, data.dataSource, chartInfo)
    }

    if (triggerType !== this.props.triggerType) {
      this.setFrequent(nextProps)
    }

    if (nextProps.widget !== this.props.widget) {
      this.initControlCascadeSource(nextProps)
    }
  }

  componentWillUnmount () {
    clearInterval(this.frequent)
  }

  setFrequent = (props) => {
    const {
      triggerType,
      triggerParams,
      itemId,
      widget,
      onGetChartData
    } = props

    if (triggerType === 'frequent') {
      this.frequent = setInterval(() => {
        onGetChartData('dynamic', itemId, widget.id)
      }, Number(triggerParams) * 1000)
    } else {
      clearInterval(this.frequent)
    }
  }

  onSyncBizdatas = () => {
    const {
      itemId,
      widget,
      onGetChartData
    } = this.props

    onGetChartData('refresh', itemId, widget.id)
  }

  onControlSearch = (queryParams) => {
    this.onSearch('rerender', queryParams)
  }

  onSearch = (renderType, queryParams) => {
    const {
      itemId,
      widget,
      onGetChartData
    } = this.props

    onGetChartData(renderType, itemId, widget.id, queryParams)
  }

  toggleControlPanel = () => {
    this.setState({
      controlPanelVisible: !this.state.controlPanelVisible
    })
  }

  onFullScreen = () => {
    const {
      onShowFullScreen,
      itemId,
      w,
      h,
      data,
      widget,
      loading,
      chartInfo,
      onGetChartData
    } = this.props
    const chartsData = {itemId, w, h, widget, data, loading, chartInfo, onGetChartData}
    if (onShowFullScreen) {
      onShowFullScreen(chartsData)
    }
  }

  sharePanelDownloadCsv = () => {
    const {
      itemId,
      shareInfo,
      onDownloadCsv
    } = this.props

    onDownloadCsv(itemId)(shareInfo)
  }
  changeSharePanelAuthorizeState = (state) => () => {
    this.setState({
      sharePanelAuthorized: state
    })
  }

  initControlCascadeSource = (props) => {
    const { itemId, widget, onGetCascadeSource } = props
    const { query_params } = widget

    JSON.parse(query_params).forEach(c => {
      if (c.type === 'cascadeSelect' && !c.parentColumn) {
        onGetCascadeSource(itemId, c.id, widget.flatTable_id, c.cascadeColumn)
      }
    })
  }

  onCascadeSelectChange = (controlId, column, parents) => {
    const { itemId, widget, onGetCascadeSource } = this.props
    onGetCascadeSource(itemId, controlId, widget.flatTable_id, column, parents)
  }

  render () {
    const {
      w,
      h,
      itemId,
      widget,
      chartInfo,
      data,
      loading,
      isAdmin,
      isShared,
      isShare,
      isDownload,
      shareInfo,
      secretInfo,
      shareInfoLoading,
      downloadCsvLoading,
      isInteractive,
      interactId,
      cascadeSources,
      onShowEdit,
      isReadOnly,
      onShowWorkbench,
      onShowFiltersForm,
      onDeleteDashboardItem,
      onDownloadCsv,
      onTurnOffInteract,
      onCheckTableInteract,
      onDoTableInteract
    } = this.props

    const {
      controlPanelVisible,
      sharePanelAuthorized
    } = this.state

    let updateParams
    let updateConfig
    let currentBizlogicId

    if (widget.config) {
      const config = JSON.parse(widget.config)
      currentBizlogicId = widget.flatTable_id
      // FIXME 前期误将 update_params 和 update_fields 字段 stringify 后存入数据库，此处暂时做判断避免问题，保存时不再 stringify，下个大版本后删除判断语句
      updateParams = typeof config['update_params'] === 'string'
        ? JSON.parse(config['update_params'])
        : config['update_params']
      updateConfig = typeof config['update_fields'] === 'string'
        ? JSON.parse(config['update_fields'])
        : config['update_fields']
    }

    const menu = (
      <Menu>
        {
          isReadOnly ? <Menu.Item className={styles.menuItem}>
            <span className={styles.menuText} onClick={onShowEdit(itemId)}>基本信息</span>
          </Menu.Item> : ''
        }
        <Menu.Item className={styles.menuItem}>
          <span className={styles.menuText} onClick={onShowFiltersForm(itemId, data && data.keys ? data.keys : [], data && data.types ? data.types : [])}>条件查询</span>
        </Menu.Item>
        {
          isReadOnly ? <Menu.Item className={styles.menuItem}>
            <Popconfirm
              title="确定删除？"
              placement="bottom"
              onConfirm={onDeleteDashboardItem(itemId)}
            >
              <span className={styles.menuText}>删除</span>
            </Popconfirm>
          </Menu.Item> : ''
        }
      </Menu>
    )

    const userDownloadButton = isDownload
      ? <Tooltip title="下载数据">
        <Popover
          placement="bottomRight"
          trigger="click"
          content={
            <DownLoadCsv
              id={widget.id}
              type="widget"
              itemId={itemId}
              shareInfo={shareInfo}
              shareInfoLoading={shareInfoLoading}
              downloadCsvLoading={downloadCsvLoading}
              onDownloadCsv={this.sharePanelDownloadCsv}
            />
          }
        >
          <Icon type="download" />
        </Popover>
      </Tooltip>
      : ''

    const shareButton = isShare
      ? <Tooltip title="分享">
        <Popover
          placement="bottomRight"
          trigger="click"
          content={
            <SharePanel
              id={widget.id}
              type="widget"
              itemId={itemId}
              shareInfo={shareInfo}
              secretInfo={secretInfo}
              shareInfoLoading={shareInfoLoading}
              downloadCsvLoading={downloadCsvLoading}
              onDownloadCsv={onDownloadCsv(itemId)}
              authorized={sharePanelAuthorized}
              afterAuthorization={this.changeSharePanelAuthorizeState(true)}
            />
          }
        >
          <Icon type="share-alt" onClick={this.changeSharePanelAuthorizeState(false)} />
        </Popover>
      </Tooltip>
      : ''

    const widgetButton = isAdmin && isReadOnly
      ? <Tooltip title="编辑widget">
        <i className="iconfont icon-edit-2" onClick={onShowWorkbench(itemId, widget)} />
      </Tooltip>
      : ''

    const filterButton = !isAdmin || isShared
      ? <Tooltip title="条件查询">
        <Icon type="search" onClick={onShowFiltersForm(itemId, data && data.keys ? data.keys : [], data && data.types ? data.types : [])} />
      </Tooltip>
      : ''

    const dropdownMenu = isAdmin
      ? <Dropdown overlay={menu} placement="bottomRight" trigger={['click']}>
        <Icon type="ellipsis" />
      </Dropdown>
      : ''

    const controls = widget.query_params
      ? JSON.parse(widget.query_params).filter(c => c.type)
      : []
    const controlPanelHandle = controls.length
      ? (
        <Tooltip title="选择参数">
          <Icon
            className={styles.control}
            type={controlPanelVisible ? 'up-square-o' : 'down-square-o'}
            onClick={this.toggleControlPanel}
          />
        </Tooltip>
      ) : ''

    const descPanelHandle = widget.desc
      ? (
        <Popover placement="bottom" content={<p className={styles.descPanel}>{widget.desc}</p>}>
          <Icon className={styles.desc} type="question-circle-o" />
        </Popover>
      ) : ''

    const controlPanelTransitionName = {
      enter: styles.controlPanelEnter,
      enterActive: styles.controlPanelEnterActive,
      leave: styles.controlPanelLeave,
      leaveActive: styles.controlPanelLeaveActive
    }

    const chartClass = {
      chart: styles.chartBlock,
      table: styles.tableBlock,
      container: styles.block
    }

    const gridItemClass = classnames({
      [styles.gridItem]: true,
      [styles.interact]: isInteractive
    })

    return (
      <div className={gridItemClass}>
        <div className={styles.header}>
          {
            chartInfo.name !== 'text'
              ? (
                <div className={styles.title}>
                  {controlPanelHandle}
                  <h4>{widget.name}</h4>
                  {descPanelHandle}
                </div>
            )
              : (
                <div className={styles.title} />
            )
          }
          <div className={styles.tools}>
            <Tooltip title="同步数据">
              <Icon type="reload" onClick={this.onSyncBizdatas} />
            </Tooltip>
            {widgetButton}
            <Tooltip title="全屏">
              <Icon type="arrows-alt" onClick={this.onFullScreen} className={styles.fullScreen} />
            </Tooltip>
            {shareButton}
            {filterButton}
            {userDownloadButton}
            {dropdownMenu}
          </div>
        </div>

        <div
          className={styles.offInteract}
          onClick={onTurnOffInteract(itemId)}
        >
          <i className="iconfont icon-unlink" />
          <h3>点击取消联动</h3>
        </div>
        <Animate
          showProp="show"
          transitionName={controlPanelTransitionName}
        >
          <DashboardItemControlPanel show={controlPanelVisible}>
            <DashboardItemControlForm
              controls={controls}
              cascadeSources={cascadeSources}
              onSearch={this.onControlSearch}
              onHide={this.toggleControlPanel}
              onCascadeSelectChange={this.onCascadeSelectChange}
            />
          </DashboardItemControlPanel>
        </Animate>
        <Chart
          id={`${itemId}`}
          w={w}
          h={h}
          title={widget.name}
          data={data || {}}
          loading={loading}
          chartInfo={chartInfo}
          updateConfig={updateConfig}
          chartParams={JSON.parse(widget.chart_params)}
          updateParams={updateParams}
          currentBizlogicId={currentBizlogicId}
          classNames={chartClass}
          interactId={interactId}
          onCheckTableInteract={onCheckTableInteract}
          onDoTableInteract={onDoTableInteract}
        />
      </div>
    )
  }
}

DashboardItem.propTypes = {
  w: PropTypes.number,
  h: PropTypes.number,
  itemId: PropTypes.number,
  widget: PropTypes.object,
  chartInfo: PropTypes.object,
  data: PropTypes.object,
  loading: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  triggerType: PropTypes.string,
  triggerParams: PropTypes.string,
  isAdmin: PropTypes.bool,
  isShared: PropTypes.bool,
  isShare: PropTypes.bool,
  isDownload: PropTypes.bool,
  shareInfo: PropTypes.string,
  secretInfo: PropTypes.string,
  shareInfoLoading: PropTypes.bool,
  downloadCsvLoading: PropTypes.bool,
  isInteractive: PropTypes.bool,
  interactId: PropTypes.string,
  cascadeSources: PropTypes.object,
  onGetChartData: PropTypes.func,
  onRenderChart: PropTypes.func,
  onShowEdit: PropTypes.func,
  onShowWorkbench: PropTypes.func,
  onShowFiltersForm: PropTypes.func,
  onDeleteDashboardItem: PropTypes.func,
  onDownloadCsv: PropTypes.func,
  onTurnOffInteract: PropTypes.func,
  onShowFullScreen: PropTypes.func,
  onCheckTableInteract: PropTypes.func,
  onDoTableInteract: PropTypes.func,
  onGetCascadeSource: PropTypes.func
}
// FIXME
DashboardItem.defaultProps = {
  onShowEdit: () => {},
  onShowWorkbench: () => {},
  onDeleteDashboardItem: () => {}
}

export default DashboardItem
