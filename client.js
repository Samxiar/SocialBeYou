// Get the file input element
const fileInput = document.querySelector('.file-input');
// Get the preview image element
const previewImage = document.querySelector('.preview-image');

// Add event listener for file input change
fileInput.addEventListener('change', function() {
    // Check if a file is selected
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();

        reader.onload = function(e) {
            // Show the preview image
            previewImage.style.display = 'block';
            // Set the preview image source to the selected file
            previewImage.src = e.target.result;
        }

        // Read the selected file as a data URL
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        // Hide the preview image if no file is selected
        previewImage.style.display = 'none';
    }
});

function postTweet() {
    const tweetText = document.getElementById('tweetText').value;

    // Send a POST request to the server to post the tweet
    fetch('/postTweet', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tweetText: tweetText })
    })
    .then(response => {
        if (response.ok) {
            console.log('Tweet posted successfully');
            // Add logic to handle successful tweet posting, such as updating the UI
        } else {
            console.error('Error posting tweet');
            // Add logic to handle tweet posting failure
        }
    })
    .catch(error => {
        console.error('Error posting tweet:', error);
        // Add logic to handle tweet posting failure
    });
}
