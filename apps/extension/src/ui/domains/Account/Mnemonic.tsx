import { MouseEventHandler, useState } from "react"
import styled from "styled-components"
import { CheckIcon, CopyIcon } from "@talisman/theme/icons"

import { classNames } from "talisman-ui"

const SecretText = styled.div`
  position: relative;
  padding: 1rem;

  .content {
    filter: blur(10px);
    cursor: pointer;
  }

  &:after {
    content: "☝";
    position: absolute;
    top: calc(50% - 28px); // accounts for height of icon itself
    left: 50%;
    font-size: var(--font-size-large);
    filter: saturate(0);
    opacity: 0.6;
    cursor: pointer;
  }

  &:hover,
  &:focus-within {
    &:after {
      display: none;
    }
    .content {
      filter: blur(0);
      cursor: auto;
    }
  }
`

type MnemonicProps = {
  onMouseEnter?: MouseEventHandler
  mnemonic: string
}

export const Mnemonic = ({ onMouseEnter, mnemonic }: MnemonicProps) => {
  const [hasCopied, setHasCopied] = useState(false)
  const [hasHovered, setHasHovered] = useState(false)

  return (
    <>
      <span
        className="inline-block py-4 text-sm"
        onClick={() => {
          if (hasHovered && !hasCopied) {
            window.navigator.clipboard.writeText(mnemonic)
            setHasCopied(true)
          }
        }}
      >
        {!hasCopied && (
          <span className={classNames(hasHovered ? "text-white" : "text-black", "cursor-pointer")}>
            <CopyIcon className="mr-2 inline" /> <span>Copy to clipboard</span>
          </span>
        )}
        {hasCopied && (
          <span className="text-primary">
            <CheckIcon className="mr-2 inline" />
            Copied
          </span>
        )}
      </span>

      <SecretText
        className="secret"
        onMouseEnter={(e) => {
          setHasHovered(true)
          onMouseEnter && onMouseEnter(e)
        }}
      >
        <div className="content flex flex-wrap">
          {mnemonic.split(" ").map((word) => (
            <span
              className="bg-body-secondary mr-2 mb-1 rounded-lg bg-opacity-30 py-3 px-4 opacity-70 "
              key={`mnemonic-${word}`}
            >
              {word}
            </span>
          ))}
        </div>
      </SecretText>
    </>
  )
}
