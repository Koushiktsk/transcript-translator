import { pipeline, env } from '@xenova/transformers'

// disable local models
env.allowLocalModels = false;
env.useBrowserCache = false;

class MyTranslationPipeline {
    static task = 'translation';
    static model = 'Xenova/nllb-200-distilled-600M';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }

        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    let translator = await MyTranslationPipeline.getInstance(x => {
        self.postMessage(x)
    })
    console.log(event.data)
    let texts = Array.isArray(event.data.text) ? event.data.text : [event.data.text];
let outputs = [];

for (let i = 0; i < texts.length; i++) {
    const chunk = texts[i];
    const out = await translator(chunk, {
        tgt_lang: event.data.tgt_lang,
        src_lang: event.data.src_lang,
        
        callback_function: x => {
            self.postMessage({
                status: 'update',
                index: i, // optional: to track which chunk is updating
                output: translator.tokenizer.decode(x[0].output_token_ids, { skip_special_tokens: true })
            });
        }
    });

    outputs.push(out[0].translation_text);
}

    console.log('HEHEHHERERE', outputs)

    self.postMessage({
        status: 'complete',
        output: outputs
    })
})