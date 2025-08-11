import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface PillIconProps {
  color?: string;
  size?: number;
}

const PillIcon: React.FC<PillIconProps> = ({ color = '#000000', size = 24 }) => {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M10.5 20.4L3.6 13.5C2.4 12.3 2.4 10.2 3.6 9L9 3.6C10.2 2.4 12.3 2.4 13.5 3.6L20.4 10.5C21.6 11.7 21.6 13.8 20.4 15L15 20.4C13.8 21.6 11.7 21.6 10.5 20.4Z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M16 8L8 16"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

export default PillIcon; 