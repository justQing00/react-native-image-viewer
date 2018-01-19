import { Dimensions, FlatList, View, Animated, StyleSheet } from 'react-native'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Pagination, Slide } from './src'
import Loading from './src/Loading'

const { width, height } = Dimensions.get('window')
const ANIMATION_DURATION = 600

export default class Gallery extends Component {
  static defaultProps = {
    backgroundColor: '#000',
    data: [],
    initialNumToRender: 4,
    initialPaginationSize: 10,
    onChangeFullscreenState: () => {},
  };

  static propTypes = {
    backgroundColor: PropTypes.string,
    data: PropTypes.arrayOf((propValue, key) => {
      if (!propValue[key].id || !propValue[key].image) {
        return new Error(
          'Data prop is invalid. It must be an object containing "id" and "image" keys.'
        )
      }
    }),
    initialNumToRender: PropTypes.number,
    initialPaginationSize: PropTypes.number,
    onChangeFullscreenState: PropTypes.func,
  };

  constructor(props) {
    super(props)
    const animationValue = 1
    this.scale = new Animated.Value(animationValue)
    this.pagination = new Animated.Value(animationValue)
  }

  state = {
    index: 0,
    pressEvent: {},
  };

  onScrollEnd = (e) => {
    const contentOffset = e.nativeEvent.contentOffset
    const viewSize = e.nativeEvent.layoutMeasurement
    const pageNum = Math.floor(contentOffset.x / viewSize.width)
    if (pageNum !== this.state.index) {
      this.setState({ index: pageNum })
    }
  }

  getItemLayout = (data, index) => {
    return {
      length: width,
      offset: width * index,
      index,
    }
  }

  getPosition = (type) => {
    const halfWidth = width / 2
    if (type === 'top') {
      const { locationY } = this.state.pressEvent
      return (-halfWidth - 200) + locationY
    }
    const { locationX } = this.state.pressEvent
    return (-halfWidth) + locationX
  };

  goTo = ({ index, animated = true, pressEvent = {} }, next) => {
    this.setState({ index, pressEvent, visible: true }, next)
    this.swiper.scrollToIndex({ index, animated })
  }

  handleOnPressImage = (index, { nativeEvent }) => {
    this.props.onChangeFullscreenState(true)
    this.goTo({
      index,
      animated: false,
      pressEvent: {
        locationY: nativeEvent.pageY,
        locationX: nativeEvent.pageX,
      },
    }, () => {
      Animated.spring(this.scale, {
        toValue: 1,
        duration: ANIMATION_DURATION,
      }).start(() => this.setState({ animationFinished: true }));

      Animated.timing(this.pagination, {
        toValue: 1,
        duration: ANIMATION_DURATION - 200,
      }).start()
    })
  };

  renderItem = item => (
    <Slide
      {...item}
      showLoading={!this.props.data.length}
    />
  );

  render() {
    const {
      backgroundColor,
      data,
      initialNumToRender,
      initialPaginationSize,
    } = this.props

    const showLoading = !data.length

    const listContainerStyle = {
      ...StyleSheet.absoluteFillObject,
      backgroundColor,
      position: 'absolute',
      top: 0,
      left: this.scale.interpolate({
        inputRange: [0, 1],
        outputRange: [this.getPosition('left'), 0],
      }),
      opacity: this.scale,
      transform: [
        {
          scale: this.scale.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
        },
      ],
    }
    console.log('data', data)
    return (
      <View
        style={[styles.container, { backgroundColor }]}
      >
        {showLoading && <Loading />}

        <Animated.View style={listContainerStyle}>
          <FlatList
            data={data}
            initialNumToRender={initialNumToRender}
            ref={ref => this.swiper = ref}
            onMomentumScrollEnd={this.onScrollEnd}
            getItemLayout={this.getItemLayout}
            renderItem={this.renderItem}
            keyExtractor={item => item.id}
            pagingEnabled
            horizontal
          />
        </Animated.View>

        <Pagination
          index={this.state.index}
          data={data}
          initialPaginationSize={initialPaginationSize}
          goTo={this.goTo}
          containerStyle={{
            position: 'absolute',
            bottom: 0,
            top: height - 80,
            transform: [
              {
                translateY: this.pagination.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
          }}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButtonContainer: {
    width: '100%',
    alignItems: 'flex-end',
  },
})
