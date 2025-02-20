/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {ElementID, Element, ElementSearchResultSet} from './ElementsInspector';
import {reportInteraction} from '../../../utils/InteractionTracker';
import ContextMenu from '../ContextMenu';
import {PureComponent, ReactElement} from 'react';
import FlexRow from '../FlexRow';
import FlexColumn from '../FlexColumn';
import Glyph from '../Glyph';
import {colors} from '../colors';
import Text from '../Text';
import styled from 'react-emotion';
import {clipboard, MenuItemConstructorOptions} from 'electron';
import React, {MouseEvent, KeyboardEvent} from 'react';

const ROW_HEIGHT = 23;

const backgroundColor = (props: {
  selected: boolean;
  focused: boolean;
  isQueryMatch: boolean;
  even: boolean;
}) => {
  if (props.selected) {
    return colors.macOSTitleBarIconSelected;
  } else if (props.isQueryMatch) {
    return colors.purpleLight;
  } else if (props.focused) {
    return '#00CF52';
  } else if (props.even) {
    return colors.light02;
  } else {
    return '';
  }
};

const backgroundColorHover = (props: {selected: boolean; focused: boolean}) => {
  if (props.selected) {
    return colors.macOSTitleBarIconSelected;
  } else if (props.focused) {
    return '#00CF52';
  } else {
    return '#EBF1FB';
  }
};

const ElementsRowContainer = styled(ContextMenu)((props: any) => ({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: backgroundColor(props),
  color: props.selected || props.focused ? colors.white : colors.grapeDark3,
  flexShrink: 0,
  flexWrap: 'nowrap',
  height: ROW_HEIGHT,
  minWidth: '100%',
  paddingLeft: (props.level - 1) * 12,
  paddingRight: 20,
  position: 'relative',

  '& *': {
    color: props.selected || props.focused ? `${colors.white} !important` : '',
  },

  '&:hover': {
    backgroundColor: backgroundColorHover(props),
  },
}));
ElementsRowContainer.displayName = 'Elements:ElementsRowContainer';

const ElementsRowDecoration = styled(FlexRow)({
  flexShrink: 0,
  justifyContent: 'flex-end',
  alignItems: 'center',
  marginRight: 4,
  position: 'relative',
  width: 16,
  top: -1,
});
ElementsRowDecoration.displayName = 'Elements:ElementsRowDecoration';

const ElementsLine = styled('div')((props: {childrenCount: number}) => ({
  backgroundColor: colors.light20,
  height: props.childrenCount * ROW_HEIGHT - 4,
  position: 'absolute',
  right: 3,
  top: ROW_HEIGHT - 3,
  zIndex: 2,
  width: 2,
  borderRadius: '999em',
}));
ElementsLine.displayName = 'Elements:ElementsLine';

const DecorationImage = styled('img')({
  height: 12,
  marginRight: 5,
  width: 12,
});
DecorationImage.displayName = 'Elements:DecorationImage';

const NoShrinkText = styled(Text)({
  flexShrink: 0,
  flexWrap: 'nowrap',
  overflow: 'hidden',
  userSelect: 'none',
  fontWeight: 400,
});
NoShrinkText.displayName = 'Elements:NoShrinkText';

const ElementsRowAttributeContainer = styled(NoShrinkText)({
  color: colors.dark80,
  fontWeight: 300,
  marginLeft: 5,
});
ElementsRowAttributeContainer.displayName =
  'Elements:ElementsRowAttributeContainer';

const ElementsRowAttributeKey = styled('span')({
  color: colors.tomato,
});
ElementsRowAttributeKey.displayName = 'Elements:ElementsRowAttributeKey';

const ElementsRowAttributeValue = styled('span')({
  color: colors.slateDark3,
});
ElementsRowAttributeValue.displayName = 'Elements:ElementsRowAttributeValue';

class PartialHighlight extends PureComponent<{
  selected: boolean;
  highlighted: string | undefined | null;
  content: string;
}> {
  static HighlightedText = styled('span')((props: {selected: boolean}) => ({
    backgroundColor: colors.lemon,
    color: props.selected ? `${colors.grapeDark3} !important` : 'auto',
  }));

  render() {
    const {highlighted, content, selected} = this.props;
    if (
      content &&
      highlighted != null &&
      highlighted != '' &&
      content.toLowerCase().includes(highlighted.toLowerCase())
    ) {
      const highlightStart = content
        .toLowerCase()
        .indexOf(highlighted.toLowerCase());
      const highlightEnd = highlightStart + highlighted.length;
      const before = content.substring(0, highlightStart);
      const match = content.substring(highlightStart, highlightEnd);
      const after = content.substring(highlightEnd);
      return (
        <span>
          {before}
          <PartialHighlight.HighlightedText selected={selected}>
            {match}
          </PartialHighlight.HighlightedText>
          {after}
        </span>
      );
    } else {
      return <span>{content}</span>;
    }
  }
}

class ElementsRowAttribute extends PureComponent<{
  name: string;
  value: string;
  matchingSearchQuery: string | undefined | null;
  selected: boolean;
}> {
  render() {
    const {name, value, matchingSearchQuery, selected} = this.props;
    return (
      <ElementsRowAttributeContainer code={true}>
        <ElementsRowAttributeKey>{name}</ElementsRowAttributeKey>=
        <ElementsRowAttributeValue>
          <PartialHighlight
            content={value}
            highlighted={
              name === 'id' || name === 'addr' ? matchingSearchQuery : ''
            }
            selected={selected}
          />
        </ElementsRowAttributeValue>
      </ElementsRowAttributeContainer>
    );
  }
}

type FlatElement = {
  key: ElementID;
  element: Element;
  level: number;
};

type FlatElements = Array<FlatElement>;

type ElementsRowProps = {
  id: ElementID;
  level: number;
  selected: boolean;
  focused: boolean;
  matchingSearchQuery: string | undefined | null;
  isQueryMatch: boolean;
  element: Element;
  even: boolean;
  onElementSelected: (key: ElementID) => void;
  onElementExpanded: (key: ElementID, deep: boolean) => void;
  childrenCount: number;
  onElementHovered:
    | ((key: ElementID | undefined | null) => void)
    | undefined
    | null;
  style?: Object;
  contextMenuExtensions: Array<ContextMenuExtension>;
  decorateRow?: DecorateRow;
};

type ElementsRowState = {
  hovered: boolean;
};

class ElementsRow extends PureComponent<ElementsRowProps, ElementsRowState> {
  constructor(props: ElementsRowProps, context: Object) {
    super(props, context);
    this.state = {hovered: false};
    this.interaction = reportInteraction('ElementsRow', props.element.name);
  }

  interaction: (name: string, data: any) => void;

  getContextMenu = (): Array<MenuItemConstructorOptions> => {
    const {props} = this;
    const items: Array<MenuItemConstructorOptions> = [
      {
        type: 'separator',
      },
      {
        label: 'Copy',
        click: () => {
          const attrs = props.element.attributes.reduce(
            (acc, val) => acc + ` ${val.name}=${val.value}`,
            '',
          );
          clipboard.writeText(`${props.element.name}${attrs}`);
        },
      },
      {
        label: props.element.expanded ? 'Collapse' : 'Expand',
        click: () => {
          this.props.onElementExpanded(this.props.id, false);
        },
      },
      {
        label: props.element.expanded
          ? 'Collapse all child elements'
          : 'Expand all child elements',
        click: () => {
          this.props.onElementExpanded(this.props.id, true);
        },
      },
    ];

    for (const extension of props.contextMenuExtensions) {
      items.push({
        label: extension.label,
        click: () => extension.click(this.props.id),
      });
    }

    return items;
  };

  onClick = () => {
    this.props.onElementSelected(this.props.id);
    this.interaction('selected', {level: this.props.level});
  };

  onDoubleClick = (event: MouseEvent<any>) => {
    this.props.onElementExpanded(this.props.id, event.altKey);
  };

  onMouseEnter = () => {
    this.setState({hovered: true});
    if (this.props.onElementHovered) {
      this.props.onElementHovered(this.props.id);
    }
  };

  onMouseLeave = () => {
    this.setState({hovered: false});
    if (this.props.onElementHovered) {
      this.props.onElementHovered(null);
    }
  };

  render() {
    const {
      element,
      id,
      level,
      selected,
      focused,
      style,
      even,
      matchingSearchQuery,
      decorateRow,
    } = this.props;
    const hasChildren = element.children && element.children.length > 0;

    let arrow;
    if (hasChildren) {
      arrow = (
        <span onClick={this.onDoubleClick} role="button" tabIndex={-1}>
          <Glyph
            size={8}
            name={element.expanded ? 'chevron-down' : 'chevron-right'}
            color={selected || focused ? 'white' : colors.light80}
          />
        </span>
      );
    }

    const attributes = element.attributes
      ? element.attributes.map(attr => (
          <ElementsRowAttribute
            key={attr.name}
            name={attr.name}
            value={attr.value}
            matchingSearchQuery={matchingSearchQuery}
            selected={selected}
          />
        ))
      : [];

    const decoration = decorateRow
      ? decorateRow(element)
      : (() => {
          switch (element.decoration) {
            case 'litho':
              return <DecorationImage src="icons/litho-logo.png" />;
            case 'componentkit':
              return <DecorationImage src="icons/componentkit-logo.png" />;
            case 'accessibility':
              return <DecorationImage src="icons/accessibility.png" />;
            default:
              return null;
          }
        })();

    // when we hover over or select an expanded element with children, we show a line from the
    // bottom of the element to the next sibling
    let line;
    const shouldShowLine =
      (selected || this.state.hovered) && hasChildren && element.expanded;
    if (shouldShowLine) {
      line = <ElementsLine childrenCount={this.props.childrenCount} />;
    }

    return (
      <ElementsRowContainer
        buildItems={this.getContextMenu}
        key={id}
        level={level}
        selected={selected}
        focused={focused}
        matchingSearchQuery={matchingSearchQuery}
        even={even}
        onClick={this.onClick}
        onDoubleClick={this.onDoubleClick}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        isQueryMatch={this.props.isQueryMatch}
        style={style}>
        <ElementsRowDecoration>
          {line}
          {arrow}
        </ElementsRowDecoration>
        <NoShrinkText code={true}>
          {decoration}
          <PartialHighlight
            content={element.name}
            highlighted={matchingSearchQuery}
            selected={selected}
          />
        </NoShrinkText>
        {attributes}
      </ElementsRowContainer>
    );
  }
}

function containsKeyInSearchResults(
  searchResults: ElementSearchResultSet | undefined | null,
  key: ElementID,
) {
  return searchResults != undefined && searchResults.matches.has(key);
}

const ElementsContainer = styled(FlexColumn)({
  backgroundColor: colors.white,
  minHeight: '100%',
  minWidth: '100%',
  overflow: 'auto',
});
ElementsContainer.displayName = 'Elements:ElementsContainer';

const ElementsBox = styled(FlexColumn)({
  alignItems: 'flex-start',
  flex: 1,
  overflow: 'auto',
});
ElementsBox.displayName = 'Elements:ElementsBox';

export type DecorateRow = (e: Element) => ReactElement<any> | undefined | null;

type ElementsProps = {
  root: ElementID | undefined | null;
  selected: ElementID | undefined | null;
  focused?: ElementID | undefined | null;
  searchResults: ElementSearchResultSet | undefined | null;
  elements: {[key: string]: Element};
  onElementSelected: (key: ElementID) => void;
  onElementExpanded: (key: ElementID, deep: boolean) => void;
  onElementHovered:
    | ((key: ElementID | undefined | null) => void)
    | undefined
    | null;
  alternateRowColor?: boolean;
  contextMenuExtensions?: Array<ContextMenuExtension>;
  decorateRow?: DecorateRow;
};

type ElementsState = {
  flatKeys: Array<ElementID>;
  flatElements: FlatElements;
  maxDepth: number;
};

export type ContextMenuExtension = {
  label: string;
  click: (element: ElementID) => any;
};

export class Elements extends PureComponent<ElementsProps, ElementsState> {
  static defaultProps = {
    alternateRowColor: true,
  };
  constructor(props: ElementsProps, context: Object) {
    super(props, context);
    this.state = {
      flatElements: [],
      flatKeys: [],
      maxDepth: 0,
    };
  }

  componentDidMount() {
    this.setProps(this.props);
  }

  componentWillReceiveProps(nextProps: ElementsProps) {
    this.setProps(nextProps);
  }

  setProps(props: ElementsProps) {
    const flatElements: FlatElements = [];
    const flatKeys: Array<ElementID> = [];

    let maxDepth = 0;

    function seed(key: ElementID, level: number) {
      const element = props.elements[key];
      if (!element) {
        return;
      }

      maxDepth = Math.max(maxDepth, level);

      flatElements.push({
        element,
        key,
        level,
      });

      flatKeys.push(key);

      if (
        element.children != null &&
        element.children.length > 0 &&
        element.expanded
      ) {
        for (const key of element.children) {
          seed(key, level + 1);
        }
      }
    }

    if (props.root != null) {
      seed(props.root, 1);
    }

    this.setState({flatElements, flatKeys, maxDepth});
  }

  selectElement = (key: ElementID) => {
    this.props.onElementSelected(key);
  };

  onKeyDown = (e: KeyboardEvent<any>) => {
    const {selected} = this.props;
    if (selected == null) {
      return;
    }

    const {props} = this;
    const {flatElements, flatKeys} = this.state;

    const selectedIndex = flatKeys.indexOf(selected);
    if (selectedIndex < 0) {
      return;
    }

    const selectedElement = props.elements[selected];
    if (!selectedElement) {
      return;
    }

    if (
      e.key === 'c' &&
      ((e.metaKey && process.platform === 'darwin') ||
        (e.ctrlKey && process.platform !== 'darwin'))
    ) {
      e.preventDefault();
      clipboard.writeText(selectedElement.name);
      return;
    }

    if (e.key === 'ArrowUp') {
      if (selectedIndex === 0 || flatKeys.length === 1) {
        return;
      }

      e.preventDefault();
      this.selectElement(flatKeys[selectedIndex - 1]);
    }

    if (e.key === 'ArrowDown') {
      if (selectedIndex === flatKeys.length - 1) {
        return;
      }

      e.preventDefault();
      this.selectElement(flatKeys[selectedIndex + 1]);
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (selectedElement.expanded) {
        // unexpand
        props.onElementExpanded(selected, false);
      } else {
        // jump to parent
        let parentKey;
        const targetLevel = flatElements[selectedIndex].level - 1;
        for (let i = selectedIndex; i >= 0; i--) {
          const {level} = flatElements[i];
          if (level === targetLevel) {
            parentKey = flatKeys[i];
            break;
          }
        }

        if (parentKey) {
          this.selectElement(parentKey);
        }
      }
    }

    if (e.key === 'ArrowRight' && selectedElement.children.length > 0) {
      e.preventDefault();
      if (selectedElement.expanded) {
        // go to first child
        this.selectElement(selectedElement.children[0]);
      } else {
        // expand
        props.onElementExpanded(selected, false);
      }
    }
  };

  buildRow = (row: FlatElement, index: number) => {
    const {
      onElementExpanded,
      onElementHovered,
      onElementSelected,
      selected,
      focused,
      searchResults,
      contextMenuExtensions,
      decorateRow,
    } = this.props;
    const {flatElements} = this.state;

    let childrenCount = 0;
    for (let i = index + 1; i < flatElements.length; i++) {
      const child = flatElements[i];
      if (child.level <= row.level) {
        break;
      } else {
        childrenCount++;
      }
    }

    let isEven = false;
    if (this.props.alternateRowColor) {
      isEven = index % 2 === 0;
    }

    return (
      <ElementsRow
        level={row.level}
        id={row.key}
        key={row.key}
        even={isEven}
        onElementExpanded={onElementExpanded}
        onElementHovered={onElementHovered}
        onElementSelected={onElementSelected}
        selected={selected === row.key}
        focused={focused === row.key}
        matchingSearchQuery={
          searchResults && containsKeyInSearchResults(searchResults, row.key)
            ? searchResults.query
            : null
        }
        isQueryMatch={containsKeyInSearchResults(searchResults, row.key)}
        element={row.element}
        childrenCount={childrenCount}
        contextMenuExtensions={contextMenuExtensions || []}
        decorateRow={decorateRow}
      />
    );
  };

  render() {
    return (
      <ElementsBox>
        <ElementsContainer onKeyDown={this.onKeyDown} tabIndex={0}>
          {this.state.flatElements.map(this.buildRow)}
        </ElementsContainer>
      </ElementsBox>
    );
  }
}
