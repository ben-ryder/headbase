import {Popover} from "@headlessui/react";
import {StrictReactNode} from "@ben-ryder/jigsaw";
import React from "react";
import { Float } from '@headlessui-float/react'

export interface ContentWithPopupProps {
  label: string,
  content: StrictReactNode,
  popupContent: StrictReactNode
}

export function ContentWithPopup(props: ContentWithPopupProps) {
  return (
    <Popover className="flex">
      <Float placement="bottom-start" offset={4} zIndex={30} flip={true}>
        <Popover.Button
          aria-label={props.label}
        >
          {props.content}
        </Popover.Button>

        <Popover.Panel>
          {props.popupContent}
        </Popover.Panel>
      </Float>
    </Popover>
  )
}
