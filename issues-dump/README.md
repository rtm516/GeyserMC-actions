# Release Action

An action to create releases for GeyserMC projects.

## Usage

TODO

### Minimal Configuration

```yaml
- uses: GeyserMC/actions/issue-dump@master
  with:
  	token: ${{ secrets.GITHUB_TOKEN }}
```

### Inputs

| Input        | Description                                    | Default         | Required |
| ------------ | -----------------------------------------------| --------------- | -------- |
| `changelog`  | The changelog for the actions summary.         |                 | `false`  |