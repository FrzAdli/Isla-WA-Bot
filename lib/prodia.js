const { downloadFile } = require('./downloader');
const axios = require('axios');
let setting = require("../key.json");

// [
//     "absolutereality_V16.safetensors [37db0fc3]",
//     "analog-diffusion-1.0.ckpt [9ca13f02]",
//     "anythingv3_0-pruned.ckpt [2700c435]",
//     "anything-v4.5-pruned.ckpt [65745d25]",
//     "anythingV5_PrtRE.safetensors [893e49b9]",
//     "AOM3A3_orangemixs.safetensors [9600da17]",
//     "deliberate_v2.safetensors [10ec4b29]",
//     "dreamlike-diffusion-1.0.safetensors [5c9fd6e0]",
//     "dreamlike-diffusion-2.0.safetensors [fdcf65e7]",
//     "dreamshaper_6BakedVae.safetensors [114c8abb]",
//     "dreamshaper_7.safetensors [5cf5ae06]",
//     "dreamshaper_8.safetensors [9d40847d]",
//     "EimisAnimeDiffusion_V1.ckpt [4f828a15]",
//     "elldreths-vivid-mix.safetensors [342d9d26]",
//     "lyriel_v16.safetensors [68fceea2]",
//     "mechamix_v10.safetensors [ee685731]",
//     "meinamix_meinaV9.safetensors [2ec66ab0]",
//     "meinamix_meinaV11.safetensors [b56ce717]",
//     "openjourney_V4.ckpt [ca2f377f]",
//     "portraitplus_V1.0.safetensors [1400e684]",
//     "Realistic_Vision_V1.4-pruned-fp16.safetensors [8d21810b]",
//     "Realistic_Vision_V4.0.safetensors [29a7afaa]",
//     "Realistic_Vision_V5.0.safetensors [614d1063]",
//     "redshift_diffusion-V10.safetensors [1400e684]",
//     "revAnimated_v122.safetensors [3f4fefd9]",
//     "sdv1_4.ckpt [7460a6fa]",
//     "v1-5-pruned-emaonly.ckpt [81761151]",
//     "shoninsBeautiful_v10.safetensors [25d8c546]",
//     "theallys-mix-ii-churned.safetensors [5d9225a4]",
//     "timeless-1.0.ckpt [7c4971d4]"
//   ]

const negative_prompt = '(out of frame), ((blur)), lowres, text, error, cropped, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, ((extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutated legs, poorly drawn legs)), mutation, deformed, blurry, dehydrated, bad anatomy, ((bad proportions bad body proportions, bad perspective, bad composition, extra limbs)), cloned face, disfigured, gross proportions, malformed limbs, ((missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck)), username, watermark, signature'


// async function prodia(prompt) {
//   try {
//     const base = "https://api.prodia.com/v1";
//     const headers = {
//       "X-Prodia-Key": setting.prodiaApi,
//     };

//     const createJob = async params => {
//       const response = await fetch(`${base}/job`, {
//         method: "POST",
//         headers: {
//           ...headers,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(params),
//       });

//       if(response.status !== 200) {
//         throw new Error(`Bad Prodia Response: ${response.status}`);
//       }
//       return response.json();
//     };

//     const getJob = async (jobId) => {
//       const response = await fetch(`${base}/job/${jobId}`, {
//         headers,
//       });

//       if(response.status !== 200) {
//         throw new Error(`Bad Prodia Response: ${response.status}`);
//       }
//       return response.json();
//     };

//     let job = await createJob({
//       sampler: 'DPM++ 2M Karras',
//       model: 'anything-v4.5-pruned.ckpt [65745d25]',
//       steps: 30,
//       cfg_scale: 10,
//       upscale: false,
//       aspect_ratio: 'square',
//       prompt: prompt,
//       seed: -1,
//       negative_prompt: negative_prompt
//     });

//     while (job.status !== "succeeded" && job.status !== "failed") {
//       await new Promise((resolve) => setTimeout(resolve, 250));
//       job = await getJob(job.job);
//     }

//     if(job.status !== "succeeded") {
//       throw new Error("Job failed!"); 
//     }

//     const filePath = `temp/prodia${Date.now()}.png`;
//     await downloadFile(job.imageUrl, filePath);

//     return filePath;
//   } catch (error) {
//     return null;
//   }
// }

async function prodia(prompt, modelNum) {
  try {
    const base = "https://api.prodia.com/v1";
    const headers = {
      "X-Prodia-Key": setting.prodiaApi,
    };

    const createJob = async params => {
      const response = await fetch(`${base}/job`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if(response.status !== 200) {
        throw new Error(`Bad Prodia Response: ${response.status}`);
      }
      return response.json();
    };

    const getJob = async (jobId) => {
      const response = await fetch(`${base}/job/${jobId}`, {
        headers,
      });

      if(response.status !== 200) {
        throw new Error(`Bad Prodia Response: ${response.status}`);
      }
      return response.json();
    };

    let model;
    switch (modelNum) {
      case '1':
        model = "anythingv3_0-pruned.ckpt [2700c435]";
        break;
      case '2':
        model = "anything-v4.5-pruned.ckpt [65745d25]";
        break;
      case '3':
        model = "anythingV5_PrtRE.safetensors [893e49b9]";
        break;
      case '4':
        model = "AOM3A3_orangemixs.safetensors [9600da17]";
        break;
      case '5':
        model = "EimisAnimeDiffusion_V1.ckpt [4f828a15]";
        break;
      case '6':
        model = "meinamix_meinaV9.safetensors [2ec66ab0]";
        break;
      case '7':
        model = "meinamix_meinaV11.safetensors [b56ce717]";
        break;
      case '8':
        model = "Realistic_Vision_V5.0.safetensors [614d1063]";
        break;
      default:
        model = "anything-v4.5-pruned.ckpt [65745d25]";
        break;
    }

    let job = await createJob({
      sampler: 'DPM++ 2M Karras',
      model: model,
      steps: 30,
      cfg_scale: 10,
      upscale: false,
      aspect_ratio: 'square',
      prompt: prompt,
      seed: -1,
      negative_prompt: negative_prompt
    });

    while (job.status !== "succeeded" && job.status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 250));
      job = await getJob(job.job);
    }

    if(job.status !== "succeeded") {
      throw new Error("Job failed!"); 
    }

    const filePath = `temp/prodia${Date.now()}.png`;
    await downloadFile(job.imageUrl, filePath);

    return filePath;
  } catch (error) {
    console.log(error)
    return null;
  }
}

async function prodia2img(imageUrl, prompt, modelNum) {
  try {
    const base = "https://api.prodia.com/v1";
    const headers = {
      "X-Prodia-Key": setting.prodiaApi,
    };

    const createJob = async params => {
      const response = await fetch(`${base}/transform`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if(response.status !== 200) {
        throw new Error(`Bad Prodia Response: ${response.status}`);
      }
      return response.json();
    };

    const getJob = async (jobId) => {
      const response = await fetch(`${base}/job/${jobId}`, {
        headers,
      });

      if(response.status !== 200) {
        throw new Error(`Bad Prodia Response: ${response.status}`);
      }
      return response.json();
    };

    let model;
    switch (modelNum) {
      case '1':
        model = "anythingv3_0-pruned.ckpt [2700c435]";
        break;
      case '2':
        model = "anything-v4.5-pruned.ckpt [65745d25]";
        break;
      case '3':
        model = "anythingV5_PrtRE.safetensors [893e49b9]";
        break;
      case '4':
        model = "AOM3A3_orangemixs.safetensors [9600da17]";
        break;
      case '5':
        model = "EimisAnimeDiffusion_V1.ckpt [4f828a15]";
        break;
      case '6':
        model = "meinamix_meinaV9.safetensors [2ec66ab0]";
        break;
      case '7':
        model = "meinamix_meinaV11.safetensors [b56ce717]";
        break;
      case '8':
        model = "Realistic_Vision_V5.0.safetensors [614d1063]";
        break;
      default:
        model = "anything-v4.5-pruned.ckpt [65745d25]";
        break;
    }

    let job = await createJob({
      sampler: 'DPM++ 2M Karras',
      imageUrl: imageUrl,
      model: model,
      prompt: `anime, ${prompt}`,
      denoising_strength: 0.6,
      negative_prompt: negative_prompt,
      steps: 30,
      cfg_scale: 10,
      seed: -1,
      upscale: false
    });

    while (job.status !== "succeeded" && job.status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 250));
      job = await getJob(job.job);
    }

    if(job.status !== "succeeded") {
      throw new Error("Job failed!"); 
    }

    const filePath = `temp/prodia${Date.now()}.png`;
    await downloadFile(job.imageUrl, filePath);

    return filePath;
  } catch (error) {
    console.log(error);
    return null;
  }
}


module.exports = { prodia, prodia2img };
