/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {FlexColumn, Button, styled, Text, FlexRow, Spacer} from 'flipper';
import React, {Component} from 'react';
import {setExportStatusComponent, unsetShare} from '../reducers/application';
import {reportPlatformFailures} from '../utils/metrics';
import CancellableExportStatus from './CancellableExportStatus';
import {performance} from 'perf_hooks';
import {Logger} from '../fb-interfaces/Logger';
import {Idler} from '../utils/Idler';
import {
  exportStoreToFile,
  EXPORT_FLIPPER_TRACE_EVENT,
} from '../utils/exportData';
import ShareSheetErrorList from './ShareSheetErrorList';
import ShareSheetPendingDialog from './ShareSheetPendingDialog';
import {ReactReduxContext} from 'react-redux';
import {store} from '../init';

const Container = styled(FlexColumn)({
  padding: 20,
  width: 500,
});

const ErrorMessage = styled(Text)({
  display: 'block',
  marginTop: 6,
  wordBreak: 'break-all',
  whiteSpace: 'pre-line',
  lineHeight: 1.35,
});

const Title = styled(Text)({
  marginBottom: 6,
});

const InfoText = styled(Text)({
  lineHeight: 1.35,
  marginBottom: 15,
});

type Props = {
  onHide: () => void;
  file: string;
  logger: Logger;
};

type State = {
  errorArray: Array<Error>;
  result:
    | {
        kind: 'success';
      }
    | {
        kind: 'error';
        error: Error;
      }
    | {
        kind: 'pending';
      };
  statusUpdate: string | null;
  runInBackground: boolean;
};

export default class ShareSheetExportFile extends Component<Props, State> {
  state: State = {
    errorArray: [],
    result: {kind: 'pending'},
    statusUpdate: null,
    runInBackground: false,
  };

  idler = new Idler();

  dispatchAndUpdateToolBarStatus(msg: string) {
    store.dispatch(
      setExportStatusComponent(
        <CancellableExportStatus
          msg={msg}
          onCancel={() => {
            this.idler.cancel();
            store.dispatch(unsetShare());
          }}
        />,
      ),
    );
  }

  async componentDidMount() {
    const mark = 'shareSheetExportFile';
    performance.mark(mark);
    try {
      if (!this.props.file) {
        return;
      }
      const {errorArray} = await reportPlatformFailures(
        exportStoreToFile(this.props.file, store, this.idler, (msg: string) => {
          if (this.state.runInBackground) {
            this.dispatchAndUpdateToolBarStatus(msg);
          } else {
            this.setState({statusUpdate: msg});
          }
        }),
        `${EXPORT_FLIPPER_TRACE_EVENT}:UI_FILE`,
      );
      store.dispatch(unsetShare());
      if (this.state.runInBackground) {
        new Notification('Sharable Flipper trace created', {
          body: `Flipper trace exported to the ${this.props.file}`,
          requireInteraction: true,
        });
        return;
      }
      this.setState({errorArray, result: {kind: 'success'}});
      this.props.logger.trackTimeSince(mark, 'export:file-success');
    } catch (err) {
      if (!this.state.runInBackground) {
        this.setState({errorArray: [], result: {kind: 'error', error: err}});
      }
      this.props.logger.trackTimeSince(mark, 'export:file-error');
    }
  }

  renderSuccess() {
    return (
      <ReactReduxContext.Consumer>
        {({store}) => (
          <Container>
            <FlexColumn>
              <Title bold>Data Exported Successfully</Title>
              <InfoText>
                When sharing your Flipper data, consider that the captured data
                might contain sensitive information like access tokens used in
                network requests.
              </InfoText>
              <ShareSheetErrorList errors={this.state.errorArray} />
            </FlexColumn>
            <FlexRow>
              <Spacer />
              <Button compact padded onClick={() => this.cancelAndHide(store)}>
                Close
              </Button>
            </FlexRow>
          </Container>
        )}
      </ReactReduxContext.Consumer>
    );
  }

  renderError(result: {kind: 'error'; error: Error}) {
    return (
      <ReactReduxContext.Consumer>
        {({store}) => (
          <Container>
            <Title bold>Error</Title>
            <ErrorMessage code>
              {result.error.message || 'File could not be saved.'}
            </ErrorMessage>
            <FlexRow>
              <Spacer />
              <Button compact padded onClick={() => this.cancelAndHide(store)}>
                Close
              </Button>
            </FlexRow>
          </Container>
        )}
      </ReactReduxContext.Consumer>
    );
  }

  renderPending(statusUpdate: string | null) {
    return (
      <ReactReduxContext.Consumer>
        {({store}) => (
          <ShareSheetPendingDialog
            statusUpdate={statusUpdate}
            statusMessage="Exporting Flipper trace..."
            onCancel={() => this.cancelAndHide(store)}
            onRunInBackground={() => {
              this.setState({runInBackground: true});
              if (statusUpdate) {
                this.dispatchAndUpdateToolBarStatus(statusUpdate);
              }
              this.props.onHide();
            }}
          />
        )}
      </ReactReduxContext.Consumer>
    );
  }

  cancelAndHide(store: any) {
    store.dispatch(unsetShare());
    this.props.onHide();
    this.idler.cancel();
  }

  render() {
    const {result, statusUpdate} = this.state;
    switch (result.kind) {
      case 'success':
        return this.renderSuccess();
      case 'error':
        return this.renderError(result);
      case 'pending':
        return this.renderPending(statusUpdate);
    }
  }
}
