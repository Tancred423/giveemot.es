const axios = require('axios')
const express = require('express')
const path = require('path')

const app = express()
const port = 3000

app.set('view engine', 'ejs')
app.use('/static', express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  res.render('index')
})

async function getEmoteUrl(emoteName, n, format) {
  const response = await axios.post('https://7tv.io/v3/gql', {
    query: `
    query Emotes($emoteName: String!) {
      emotes(query: $emoteName) {
        count
        max_page
        items {
          name
          tags
          animated
          host {
            url
          }
        }
      }
    }
  `,
    variables: {
      emoteName,
    },
  })

  const nthItem = response.data.data.emotes.items[n > 0 ? n - 1 : 0]
  return `https:${nthItem.host.url}/4x.${format || 'webp'}`
}

app.get('/:emoteName', async (req, res) => {
  try {
    const { emoteName } = req.params
    const { format } = req.query

    let emoteUrl = await getEmoteUrl(emoteName, 1, format ?? 'png')

    const pngResponse = await axios.get(emoteUrl, {
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 403,
    })

    if (pngResponse.status === 200) {
      return res.redirect(emoteUrl)
    }

    emoteUrl = await getEmoteUrl(emoteName, 1, 'gif')
    await axios.get(emoteUrl)

    res.redirect(emoteUrl)
  } catch (e) {
    res.status(404).send('Emote not found')
  }
})

app.get('/:emoteName/:n', async (req, res) => {
  try {
    const { emoteName, n } = req.params
    const { format } = req.query

    let emoteUrl = await getEmoteUrl(emoteName, n, format ?? 'png')

    const pngResponse = await axios.get(emoteUrl, {
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 403,
    })

    if (pngResponse.status === 200) {
      return res.redirect(emoteUrl)
    }

    emoteUrl = await getEmoteUrl(emoteName, n, 'gif')
    await axios.get(emoteUrl)

    res.redirect(emoteUrl)
  } catch (e) {
    res.status(404).send('Emote not found')
  }
})

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})
