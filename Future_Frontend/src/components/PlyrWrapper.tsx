'use client';

import { Plyr } from "plyr-react";
import "plyr/dist/plyr.css";

export default function PlyrWrapper(props: any) {
  return <Plyr {...props} />;
}