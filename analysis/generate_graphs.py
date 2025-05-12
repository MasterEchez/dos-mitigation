import os
import pandas as pd
import matplotlib.pyplot as plt
import argparse

# Define a function to generate and save the graphs
def plot_graphs(session_name, hosts):
    # Define the root directory where logs are stored (updated to "/usr/local/dos-mitigation/data")
    root_dir = "/usr/local/dos-mitigation/data"

    # Define the possible scenarios
    scenarios = ['MA', 'MB', 'UA', 'UB']

    # Iterate through each host in the provided list
    for host_name in hosts:
        print(f"Processing data for host: {host_name}")
        # Iterate through each scenario
        for scenario in scenarios:
            # Build the file path pattern for the CSV logs
            file_path = os.path.join(root_dir, session_name, host_name, scenario, "logs", "jitsi.csv")

            # Check if the file exists
            if os.path.exists(file_path):
                print(f"Processing file: {file_path}")
                
                # Read the CSV into a pandas DataFrame
                df = pd.read_csv(file_path)

                # Make sure timestamp is in datetime format
                df['timestamp'] = pd.to_datetime(df['timestamp'])

                # Get the columns we need to plot (exclude the 'timestamp' column)
                columns_to_plot = [col for col in df.columns if col != 'timestamp']
                
                # Create a plot for each column
                for col in columns_to_plot:
                    plt.figure(figsize=(10, 6))
                    plt.plot(df['timestamp'], df[col], label=col)
                    plt.xlabel('Timestamp')
                    plt.ylabel(col)
                    plt.title(f'{col} vs Timestamp for {host_name} in scenario {scenario}')
                    plt.xticks(rotation=45)
                    plt.tight_layout()

                    # Save the plot as a PNG file
                    plot_filename = f"{session_name}_{host_name}_{scenario}_{col}.png"
                    plt.savefig(plot_filename)
                    print(f"Saved plot as {plot_filename}")
                    plt.close()
            else:
                print(f"File not found: {file_path}")

# Main function to handle the command-line arguments
def main():
    parser = argparse.ArgumentParser(description="Generate graphs from Jitsi logs.")
    parser.add_argument('session_name', type=str, help='The session name (e.g., session_1)')
    parser.add_argument('hosts', type=str, help='Comma-separated list of host names (e.g., c0,c1,c2)')

    args = parser.parse_args()

    # Parse the list of hosts from the command-line argument
    hosts = args.hosts.split(',')

    # Call the plot function with the provided session_name and list of hosts
    plot_graphs(args.session_name, hosts)

if __name__ == "__main__":
    main()
