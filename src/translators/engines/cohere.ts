import axios from 'axios'
import TranslateEngine, { TranslateOptions, TranslateResult } from './base'
import { Config } from '~/core'

export default class CohereTranslate extends TranslateEngine {
  apiRoot = 'https://api.cohere.com'
  systemPrompt = `You are a professional translation engine.
Please follow these rules strictly:

1. Only provide the translation of the text. Do not add any additional information.
2. Do not translate tags, e.g., <cta>TEXT_TO_TRANSLATE</cta>.
3. Do not translate variable names used for interpolation, e.g., {item}.
4. Do not translate JSON keys, only translate the values.
5. Maintain the original capitalization of the text.`

  async translate(options: TranslateOptions) {
    const apiKey = Config.cohereApiKey
    let apiRoot = this.apiRoot
    if (Config.cohereApiRoot) apiRoot = Config.cohereApiRoot.replace(/\/$/, '')
    const model = Config.cohereApiModel

    const response = await axios.post(
      `${apiRoot}/v2/chat`,
      {
        model,
        messages: [
          {
            role: 'system',
            content: this.systemPrompt,
          },
          {
            role: 'user',
            content: this.generateUserPrompts(options),
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      },
    )

    return this.transform(response, options)
  }

  transform(response: any, options: TranslateOptions): TranslateResult {
    const { text, from = 'auto', to = 'auto' } = options

    const translatedText = response.data.message.content[0].text.trim()

    const r: TranslateResult = {
      text,
      to,
      from,
      response,
      result: translatedText ? [translatedText] : undefined,
      linkToResult: '',
    }

    return r
  }

  generateUserPrompts(options: TranslateOptions): string {
    const sourceLang = options.from
    const targetLang = options.to

    const generatedUserPrompt = `translate from ${sourceLang} to ${targetLang}:\n\n${options.text}`

    return generatedUserPrompt
  }
}
