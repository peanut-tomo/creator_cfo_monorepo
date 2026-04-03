import { Image, StyleSheet } from "react-native";

import cfoIcon from "../../assets/cfo_icon.png";

interface CfoAvatarProps {
  size?: number;
}

export function CfoAvatar({ size = 34 }: CfoAvatarProps) {
  return <Image source={cfoIcon} style={[styles.image, { borderRadius: size / 2, height: size, width: size }]} />;
}

const styles = StyleSheet.create({
  image: {
    overflow: "hidden",
  },
});
